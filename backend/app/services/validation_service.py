"""Vision Performance Validation service."""
from __future__ import annotations

import csv
import json
import math
from io import StringIO
from typing import Optional

import numpy as np

from app.schemas.validation import (
    AccuracyResult, AIResult, ComponentScore, FinalScore,
    GRRInput, GRRResult, OCRResult, RepeatabilityResult,
    RuntimeResult, StabilityResult, ValidationRequest, ValidationResult,
)

# ── Math helpers ───────────────────────────────────────────────────────────────

def _trapz(y: list[float], x: list[float]) -> float:
    return float(sum((x[i+1]-x[i]) * (y[i]+y[i+1]) / 2 for i in range(len(x)-1)))


def _levenshtein(s1: str, s2: str) -> int:
    m, n = len(s1), len(s2)
    dp = list(range(n + 1))
    for i in range(1, m + 1):
        prev = dp[0]; dp[0] = i
        for j in range(1, n + 1):
            tmp = dp[j]
            dp[j] = prev if s1[i-1] == s2[j-1] else 1 + min(prev, dp[j], dp[j-1])
            prev = tmp
    return dp[n]


def _percentile(data: np.ndarray, p: float) -> float:
    return float(np.percentile(data, p))


# ── Analysis functions ─────────────────────────────────────────────────────────

def _repeatability(
    measurements: list[float],
    usl: Optional[float],
    lsl: Optional[float],
) -> RepeatabilityResult:
    arr = np.array(measurements, dtype=np.float64)
    n = len(arr)
    mu  = float(arr.mean())
    std = float(arr.std(ddof=1)) if n > 1 else 0.0
    cv  = round(std / abs(mu) * 100, 4) if abs(mu) > 1e-10 else 0.0

    cp = cpk = None
    if usl is not None and lsl is not None and std > 1e-12:
        cp  = round((usl - lsl) / (6 * std), 4)
        cpk = round(min((usl - mu) / (3 * std), (mu - lsl) / (3 * std)), 4)

    hist, edges = np.histogram(arr, bins=20)
    if cpk is None:
        status = "n/a"
    elif cpk >= 1.33:
        status = "capable"
    elif cpk >= 1.0:
        status = "marginal"
    else:
        status = "incapable"

    return RepeatabilityResult(
        n=n, mean=round(mu, 6), std=round(std, 6),
        min_val=round(float(arr.min()), 6), max_val=round(float(arr.max()), 6),
        range_val=round(float(arr.max() - arr.min()), 6),
        cp=cp, cpk=cpk, cv_pct=cv, usl=usl, lsl=lsl,
        histogram=[float(v) for v in hist.tolist()],
        histogram_edges=[float(v) for v in edges.tolist()],
        status=status,
    )


def _accuracy(
    measured: list[float],
    reference: list[float],
) -> AccuracyResult:
    m = np.array(measured, dtype=np.float64)
    r = np.array(reference, dtype=np.float64)
    errs = m - r
    abs_errs = np.abs(errs)
    mae  = float(abs_errs.mean())
    rmse = float(np.sqrt((errs**2).mean()))
    bias = float(errs.mean())
    rel_errs = abs_errs / (np.abs(r) + 1e-10) * 100
    mape = float(rel_errs.mean())
    status = ("excellent" if mae < 0.1 * float(np.abs(r).mean())
              else "acceptable" if mae < 0.3 * float(np.abs(r).mean())
              else "poor")
    return AccuracyResult(
        n=len(m), mae=round(mae, 6), mape_pct=round(mape, 4),
        bias=round(bias, 6), rmse=round(rmse, 6),
        max_error=round(float(abs_errs.max()), 6),
        errors=[round(float(e), 6) for e in errs.tolist()],
        status=status,
    )


def _grr(inp: GRRInput) -> GRRResult:
    data = np.array(inp.values, dtype=np.float64)
    o, p, r = inp.n_operators, inp.n_parts, inp.n_replicates
    data = data.reshape(o, p, r)

    grand = float(data.mean())
    op_m  = data.mean(axis=(1, 2))
    pt_m  = data.mean(axis=(0, 2))

    SS_op   = p * r * float(((op_m - grand) ** 2).sum())
    SS_pt   = o * r * float(((pt_m - grand) ** 2).sum())
    cell_m  = data.mean(axis=2)
    SS_int  = r * float(((cell_m - op_m[:,None] - pt_m[None,:] + grand) ** 2).sum())
    SS_tot  = float(((data - grand) ** 2).sum())
    SS_err  = SS_tot - SS_op - SS_pt - SS_int

    df_op = max(o - 1, 1); df_pt = max(p - 1, 1)
    df_int = df_op * df_pt; df_err = max(o * p * (r - 1), 1)

    MS_op   = SS_op  / df_op
    MS_pt   = SS_pt  / df_pt
    MS_int  = SS_int / df_int
    MS_err  = max(SS_err / df_err, 1e-14)

    F_int = MS_int / MS_err
    if F_int > 4.0:
        var_rep   = MS_err
        var_repro = max(0.0, (MS_op - MS_int) / (p * r))
        var_parts = max(0.0, (MS_pt  - MS_int) / (o * r))
    else:
        MS_pool   = (SS_int + SS_err) / (df_int + df_err)
        var_rep   = MS_pool
        var_repro = max(0.0, (MS_op - MS_pool) / (p * r))
        var_parts = max(0.0, (MS_pt  - MS_pool) / (o * r))

    var_grr   = var_rep + var_repro
    var_total = var_grr + var_parts
    eps = 1e-14

    if var_total < eps:
        return GRRResult(n_operators=o, n_parts=p, n_replicates=r,
                         ev_pct=0, av_pct=0, grr_pct=0, pv_pct=100,
                         ndc=99, var_repeatability=0, var_reproducibility=0, var_parts=0,
                         status="acceptable")

    if inp.tolerance:
        k = 5.15  # 99% confidence interval factor
        ev_pct  = math.sqrt(var_rep)   * k / inp.tolerance * 100
        av_pct  = math.sqrt(var_repro) * k / inp.tolerance * 100
        grr_pct = math.sqrt(var_grr)   * k / inp.tolerance * 100
        pv_pct  = math.sqrt(var_parts) * k / inp.tolerance * 100
    else:
        ev_pct  = math.sqrt(var_rep   / var_total) * 100
        av_pct  = math.sqrt(var_repro / var_total) * 100
        grr_pct = math.sqrt(var_grr   / var_total) * 100
        pv_pct  = math.sqrt(var_parts / var_total) * 100

    ndc = max(1, int(1.41 * math.sqrt(var_parts / max(var_grr, eps))))
    status = "acceptable" if grr_pct < 10 else "marginal" if grr_pct < 30 else "unacceptable"
    return GRRResult(
        n_operators=o, n_parts=p, n_replicates=r,
        ev_pct=round(ev_pct, 3), av_pct=round(av_pct, 3),
        grr_pct=round(grr_pct, 3), pv_pct=round(pv_pct, 3),
        ndc=ndc,
        var_repeatability=round(var_rep, 10), var_reproducibility=round(var_repro, 10),
        var_parts=round(var_parts, 10), status=status,
    )


def _ai_performance(
    preds: list[int],
    truth: list[int],
    scores: Optional[list[float]],
    class_names: Optional[list[str]],
) -> AIResult:
    n = len(preds)
    classes = sorted(set(truth) | set(preds))
    nc = len(classes)
    names = class_names if class_names and len(class_names) == nc else [str(c) for c in classes]

    # Confusion matrix
    idx = {c: i for i, c in enumerate(classes)}
    cm = [[0] * nc for _ in range(nc)]
    for t, p in zip(truth, preds):
        if t in idx and p in idx:
            cm[idx[t]][idx[p]] += 1

    # Per-class P/R/F1
    pp, pr, pf = [], [], []
    for i in range(nc):
        tp = cm[i][i]
        fp = sum(cm[r][i] for r in range(nc)) - tp
        fn = sum(cm[i][c] for c in range(nc)) - tp
        p_ = tp / max(tp + fp, 1)
        r_ = tp / max(tp + fn, 1)
        f_ = 2 * p_ * r_ / max(p_ + r_, 1e-10)
        pp.append(round(p_, 4)); pr.append(round(r_, 4)); pf.append(round(f_, 4))

    accuracy  = round(sum(cm[i][i] for i in range(nc)) / max(n, 1), 4)
    precision = round(float(np.mean(pp)), 4)
    recall    = round(float(np.mean(pr)), 4)
    f1        = round(float(np.mean(pf)), 4)

    # ROC / PR for binary classification
    roc_auc = pr_auc = None
    roc_fpr = roc_tpr = pr_prec = pr_rec = None
    if nc == 2 and scores and len(scores) == n:
        pos_class = classes[1]
        y_bin = [1 if t == pos_class else 0 for t in truth]
        pairs = sorted(zip(scores, y_bin), key=lambda x: -x[0])
        tps = fps = 0
        total_pos = sum(y_bin); total_neg = n - total_pos
        fprs_l, tprs_l, precs_l, recs_l = [0.0], [0.0], [], []
        for sc, lb in pairs:
            if lb: tps += 1
            else:  fps += 1
            fprs_l.append(fps / max(total_neg, 1))
            tprs_l.append(tps / max(total_pos, 1))
            precs_l.append(tps / (tps + fps))
            recs_l.append(tps / max(total_pos, 1))
        fprs_l.append(1.0); tprs_l.append(1.0)
        # Downsample to max 100 points
        step = max(1, len(fprs_l) // 100)
        roc_fpr = [round(v, 4) for v in fprs_l[::step]]
        roc_tpr = [round(v, 4) for v in tprs_l[::step]]
        roc_auc = round(_trapz(tprs_l, fprs_l), 4)
        pr_rec_full = [0.0] + recs_l
        pr_pre_full = [1.0] + precs_l
        step2 = max(1, len(pr_rec_full) // 100)
        pr_rec  = [round(v, 4) for v in pr_rec_full[::step2]]
        pr_prec = [round(v, 4) for v in pr_pre_full[::step2]]
        pr_auc  = round(_trapz(pr_pre_full, pr_rec_full), 4)

    status = ("excellent" if f1 >= 0.95 else "good" if f1 >= 0.85
              else "acceptable" if f1 >= 0.70 else "poor")
    return AIResult(
        n_samples=n, accuracy=accuracy, precision=precision, recall=recall, f1_score=f1,
        confusion_matrix=cm, class_names=names,
        per_class_precision=pp, per_class_recall=pr, per_class_f1=pf,
        roc_auc=roc_auc, pr_auc=pr_auc,
        roc_fpr=roc_fpr, roc_tpr=roc_tpr,
        pr_precision=pr_prec, pr_recall_pts=pr_rec,
        status=status,
    )


def _ocr(
    predicted: list[str],
    ground_truth: list[str],
    confidences: Optional[list[float]],
) -> OCRResult:
    n = len(predicted)
    total_chars = sum(max(len(g), 1) for g in ground_truth)
    total_words = sum(max(len(g.split()), 1) for g in ground_truth)

    char_errors = sum(_levenshtein(p, g) for p, g in zip(predicted, ground_truth))
    word_errors = sum(
        _levenshtein(p.split(), g.split())  # type: ignore[arg-type]
        for p, g in zip(predicted, ground_truth)
    )
    correct_words = sum(1 for p, g in zip(predicted, ground_truth) if p == g)

    cer  = round(char_errors  / max(total_chars, 1) * 100, 3)
    wer  = round(word_errors  / max(total_words, 1) * 100, 3)
    w_acc = round(correct_words / n * 100, 3)
    c_acc = round(max(0.0, 100.0 - cer), 3)

    conf_mean = conf_hist = None
    if confidences and len(confidences) == n:
        conf_arr = np.array(confidences)
        conf_mean = round(float(conf_arr.mean()) * 100, 2)
        h, _ = np.histogram(conf_arr, bins=20, range=(0, 1))
        conf_hist = [float(v) for v in h.tolist()]

    status = ("excellent" if c_acc >= 99 else "good" if c_acc >= 97
              else "acceptable" if c_acc >= 95 else "poor")
    return OCRResult(
        n_samples=n, char_accuracy_pct=c_acc, word_accuracy_pct=w_acc,
        cer_pct=cer, wer_pct=wer, mean_confidence_pct=conf_mean,
        confidence_hist=conf_hist, status=status,
    )


def _runtime(
    times_ms: list[float],
    target_fps: Optional[float],
) -> RuntimeResult:
    arr = np.array(times_ms, dtype=np.float64)
    n   = len(arr)
    mu  = float(arr.mean())
    fps = round(1000.0 / max(mu, 0.001), 2)
    hist, edges = np.histogram(arr, bins=20)
    ok = target_fps is None or fps >= target_fps
    fps_ratio = fps / max(target_fps, 0.001) if target_fps else 1.0
    status = ("excellent" if fps_ratio >= 1.2 else "good" if fps_ratio >= 1.0
              else "marginal" if fps_ratio >= 0.8 else "poor")
    return RuntimeResult(
        n_samples=n, mean_ms=round(mu, 3), std_ms=round(float(arr.std()), 3),
        min_ms=round(float(arr.min()), 3), max_ms=round(float(arr.max()), 3),
        p50_ms=round(_percentile(arr, 50), 3), p95_ms=round(_percentile(arr, 95), 3),
        p99_ms=round(_percentile(arr, 99), 3), fps=fps, target_fps=target_fps,
        histogram=[float(v) for v in hist.tolist()],
        histogram_edges=[float(v) for v in edges.tolist()],
        status=status,
    )


def _stability(results: list[bool]) -> StabilityResult:
    n = len(results)
    passes = sum(results)
    fails  = n - passes
    pass_r = round(passes / n * 100, 4)
    fail_r = round(fails  / n * 100, 4)

    first_fail: Optional[int] = next((i for i, v in enumerate(results) if not v), None)
    fail_pos = [i for i, v in enumerate(results) if not v]

    # Max consecutive failures
    max_consec = cur_consec = 0
    for v in results:
        if not v:
            cur_consec += 1
            max_consec = max(max_consec, cur_consec)
        else:
            cur_consec = 0

    # Rolling pass rate (window = min(50, n//5))
    w = max(1, min(50, n // 5))
    trend: list[float] = []
    for i in range(n):
        window = results[max(0, i-w+1):i+1]
        trend.append(round(sum(window) / len(window) * 100, 2))

    status = ("excellent" if pass_r >= 99.9 else "good" if pass_r >= 99.0
              else "acceptable" if pass_r >= 95.0 else "poor")
    return StabilityResult(
        n_runs=n, pass_count=passes, fail_count=fails,
        pass_rate_pct=pass_r, failure_rate_pct=fail_r,
        first_failure_at=first_fail, max_consecutive_failures=max_consec,
        fail_positions=fail_pos[:50],  # max 50 positions
        trend=trend[::max(1, n//200)],  # downsample to max 200 points
        status=status,
    )


# ── Scoring ────────────────────────────────────────────────────────────────────

def _score(status: str, good_val: Optional[float] = None) -> float:
    table = {"excellent": 95, "capable": 95, "good": 82, "marginal": 65,
             "acceptable": 72, "incapable": 40, "unacceptable": 30, "poor": 35, "n/a": 50}
    return float(table.get(status, 50))


def _final_score(
    rep: Optional[RepeatabilityResult],
    acc: Optional[AccuracyResult],
    grr_r: Optional[GRRResult],
    ai:  Optional[AIResult],
    ocr: Optional[OCRResult],
    rt:  Optional[RuntimeResult],
    stb: Optional[StabilityResult],
    system_name: str,
) -> FinalScore:
    weights = {
        "Repeatability":  (rep,  0.15),
        "Accuracy":       (acc,  0.10),
        "GR&R":           (grr_r,0.10),
        "AI Performance": (ai,   0.25),
        "OCR":            (ocr,  0.15),
        "Runtime":        (rt,   0.10),
        "Stability":      (stb,  0.15),
    }

    scores_d: dict[str, ComponentScore] = {}
    total_w = 0.0
    total_s = 0.0
    for label, (result, w) in weights.items():
        if result is not None:
            s = _score(result.status)
            scores_d[label] = ComponentScore(score=round(s, 1), weight=w, label=label, available=True)
            total_s += s * w; total_w += w
        else:
            scores_d[label] = ComponentScore(score=0, weight=w, label=label, available=False)

    overall = round(total_s / max(total_w, 0.01), 1)
    verdict = "PASS" if overall >= 85 else "CONDITIONAL PASS" if overall >= 70 else "FAIL"

    # Recommendations
    recs: list[str] = []
    if rep and rep.cpk and rep.cpk < 1.33:
        recs.append(f"Repeatability Cpk={rep.cpk:.3f} < 1.33 — improve mechanical stability or reduce vibration")
    if grr_r and grr_r.grr_pct > 10:
        recs.append(f"GR&R {grr_r.grr_pct:.1f}% exceeds 10% — recalibrate measurement system")
    if ai and ai.f1_score < 0.90:
        recs.append(f"AI F1={ai.f1_score:.3f} < 0.90 — retrain with more diverse data or tune threshold")
    if ocr and ocr.cer_pct > 1.0:
        recs.append(f"OCR CER={ocr.cer_pct:.2f}% — improve image resolution and contrast for OCR region")
    if rt and rt.target_fps and rt.fps < rt.target_fps:
        recs.append(f"Runtime {rt.fps:.1f} FPS < target {rt.target_fps:.1f} FPS — optimize model or upgrade hardware")
    if stb and stb.pass_rate_pct < 99.0:
        recs.append(f"Stability {stb.pass_rate_pct:.2f}% pass rate — investigate failure root causes")
    if verdict == "PASS":
        recs.append(f"System '{system_name}' passes all validation criteria — approved for production deployment")
    elif verdict == "CONDITIONAL PASS":
        recs.append("System requires improvement in flagged areas before full production approval")

    labels = [k for k in scores_d]; values = [scores_d[k].score if scores_d[k].available else 0 for k in labels]
    return FinalScore(
        overall_score=overall, verdict=verdict,
        component_scores=scores_d, recommendations=recs,
        radar_labels=labels, radar_values=values,
    )


# ── Export ─────────────────────────────────────────────────────────────────────

def _build_exports(result: "ValidationResult") -> tuple[str, str]:
    summary: dict = {"system": result.system_name, "overall_score": result.final_score.overall_score,
                     "verdict": result.final_score.verdict}
    if result.repeatability:
        r = result.repeatability
        summary["repeatability"] = {"mean": r.mean, "std": r.std, "cp": r.cp, "cpk": r.cpk, "status": r.status}
    if result.ai:
        a = result.ai
        summary["ai"] = {"accuracy": a.accuracy, "f1": a.f1_score, "roc_auc": a.roc_auc, "status": a.status}
    if result.ocr:
        o = result.ocr
        summary["ocr"] = {"cer_pct": o.cer_pct, "wer_pct": o.wer_pct, "status": o.status}
    if result.runtime:
        rt = result.runtime
        summary["runtime"] = {"mean_ms": rt.mean_ms, "fps": rt.fps, "p99_ms": rt.p99_ms, "status": rt.status}
    if result.stability:
        s = result.stability
        summary["stability"] = {"pass_rate_pct": s.pass_rate_pct, "status": s.status}
    json_str = json.dumps(summary, indent=2)

    buf = StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Module", "Metric", "Value", "Status"])
    writer.writerow(["Overall", "Score",  result.final_score.overall_score, result.final_score.verdict])
    if result.repeatability:
        r = result.repeatability
        for k, v in [("Mean", r.mean), ("Std", r.std), ("Cp", r.cp), ("Cpk", r.cpk)]:
            writer.writerow(["Repeatability", k, v, r.status])
    if result.ai:
        a = result.ai
        for k, v in [("Accuracy", a.accuracy), ("F1", a.f1_score), ("Precision", a.precision), ("Recall", a.recall)]:
            writer.writerow(["AI", k, v, a.status])
    if result.ocr:
        o = result.ocr
        for k, v in [("CER %", o.cer_pct), ("WER %", o.wer_pct), ("Char Acc %", o.char_accuracy_pct)]:
            writer.writerow(["OCR", k, v, o.status])
    if result.runtime:
        rt = result.runtime
        for k, v in [("Mean ms", rt.mean_ms), ("FPS", rt.fps), ("P95 ms", rt.p95_ms)]:
            writer.writerow(["Runtime", k, v, rt.status])
    if result.stability:
        s = result.stability
        writer.writerow(["Stability", "Pass Rate %", s.pass_rate_pct, s.status])
    return json_str, buf.getvalue()


# ── Public entry point ─────────────────────────────────────────────────────────

def run_validation(req: ValidationRequest) -> ValidationResult:
    rep = _repeatability(req.measurements, req.usl, req.lsl) if req.measurements else None
    acc = _accuracy(req.measurements, req.reference_values) \
        if req.measurements and req.reference_values and len(req.measurements) == len(req.reference_values) else None
    grr_r = _grr(req.grr) if req.grr else None
    ai  = _ai_performance(req.predictions, req.ground_truth, req.scores, req.class_names) \
        if req.predictions and req.ground_truth and len(req.predictions) == len(req.ground_truth) else None
    ocr = _ocr(req.ocr_predicted, req.ocr_ground_truth, req.ocr_confidences) \
        if req.ocr_predicted and req.ocr_ground_truth and len(req.ocr_predicted) == len(req.ocr_ground_truth) else None
    rt  = _runtime(req.inference_times_ms, req.target_fps) if req.inference_times_ms else None
    stb = _stability(req.stability_results) if req.stability_results else None

    fs = _final_score(rep, acc, grr_r, ai, ocr, rt, stb, req.system_name)

    # Build partial result to pass to export
    partial = ValidationResult(
        system_name=req.system_name,
        repeatability=rep, accuracy=acc, grr=grr_r, ai=ai, ocr=ocr, runtime=rt, stability=stb,
        final_score=fs, export_json="", export_csv="",
    )
    json_s, csv_s = _build_exports(partial)
    partial.export_json = json_s
    partial.export_csv  = csv_s
    return partial
