"""Image Comparison service — multi-image objective quality metrics."""
from __future__ import annotations

import math
from typing import Optional

import cv2
import numpy as np

from app.schemas.image_comparison import (
    ComparisonResult, DiffResult, ImageMetrics,
)

# ── helpers ────────────────────────────────────────────────────────────────────

def _to_gray(img: np.ndarray) -> np.ndarray:
    if img.ndim == 3 and img.shape[2] == 4:
        return cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
    if img.ndim == 3:
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return img


def _max_val(img: np.ndarray) -> float:
    return 65535.0 if img.dtype == np.uint16 else 255.0


def _normalize(values: list[float], higher_is_better: bool = True) -> list[float]:
    mn, mx = min(values), max(values)
    if abs(mx - mn) < 1e-10:
        return [50.0] * len(values)
    if higher_is_better:
        return [(v - mn) / (mx - mn) * 100 for v in values]
    return [(mx - v) / (mx - mn) * 100 for v in values]


def _downsample_map(data: np.ndarray, max_side: int = 32) -> tuple[list[list[float]], int, int]:
    data = data.astype(np.float32)
    h, w = data.shape
    if max(h, w) > max_side:
        scale = max_side / max(h, w)
        nw = max(1, int(w * scale)); nh = max(1, int(h * scale))
        data = cv2.resize(data, (nw, nh), interpolation=cv2.INTER_AREA)
    return [[float(v) for v in row] for row in data.tolist()], int(data.shape[0]), int(data.shape[1])


def _focus_map(g: np.ndarray, block: int = 16) -> np.ndarray:
    h, w = g.shape
    rb, cb = max(1, h // block), max(1, w // block)
    fmap = np.zeros((rb, cb), np.float32)
    for r in range(rb):
        for c in range(cb):
            blk = g[r*block:(r+1)*block, c*block:(c+1)*block]
            lap = cv2.Laplacian(blk.astype(np.float64), cv2.CV_64F)
            fmap[r, c] = float(lap.var())
    return fmap


def _noise_map(g: np.ndarray, block: int = 16) -> np.ndarray:
    h, w = g.shape
    k = max(1, min(5, h // 2, w // 2))
    k = k if k % 2 == 1 else max(1, k - 1)
    blurred = cv2.GaussianBlur(g.astype(np.float32), (k, k), 0).astype(np.float64)
    residual = np.abs(g - blurred)
    rb, cb = max(1, h // block), max(1, w // block)
    nmap = np.zeros((rb, cb), np.float32)
    for r in range(rb):
        for c in range(cb):
            cell = residual[r*block:(r+1)*block, c*block:(c+1)*block]
            nmap[r, c] = float(cell.mean()) if cell.size else 0.0
    return nmap


# ── per-image metrics ──────────────────────────────────────────────────────────

def _compute_metrics(
    img_bgr: np.ndarray,
    index: int,
    name: str,
) -> dict:
    mv = _max_val(img_bgr)
    gray = _to_gray(img_bgr)
    h, w = gray.shape
    g = gray.astype(np.float64)
    is_color = img_bgr.ndim == 3 and img_bgr.shape[2] >= 3

    # ── Sharpness ──
    lap = cv2.Laplacian(g, cv2.CV_64F)
    lap_var = float(lap.var())

    ksize = min(3, h, w)
    ksize = ksize if ksize % 2 == 1 else max(1, ksize - 1)
    gx = cv2.Sobel(g, cv2.CV_64F, 1, 0, ksize=ksize)
    gy = cv2.Sobel(g, cv2.CV_64F, 0, 1, ksize=ksize)
    tenengrad = float(np.mean(gx**2 + gy**2))
    brenner = float(np.mean((g[2:,:] - g[:-2,:])**2)) if h > 2 else 0.0
    sobel_e = float(np.mean(np.sqrt(gx**2 + gy**2 + 1e-10)))

    fft2 = np.fft.fftshift(np.fft.fft2(g))
    mag = np.abs(fft2)
    cy, cx = h // 2, w // 2
    yo, xo = np.ogrid[:h, :w]
    r_map = np.sqrt((yo - cy)**2 + (xo - cx)**2)
    low_r = min(h, w) / 8.0
    fft_sharp = float(mag[r_map > low_r].sum()) / (float(mag.sum()) + 1e-10)

    img_u8 = gray if gray.dtype == np.uint8 else (gray / mv * 255).astype(np.uint8)
    edges = cv2.Canny(img_u8, 50, 150)
    edge_dens = float(edges.sum()) / (h * w * 255.0)

    # ── Brightness ──
    gn = g / mv
    mean_b   = float(gn.mean()) * 100
    median_b = float(np.median(gn)) * 100
    std_b    = float(gn.std()) * 100
    p5, p95  = float(np.percentile(gn, 5)), float(np.percentile(gn, 95))
    dyn_r    = (p95 - p5) * 100

    # ── Contrast ──
    mn_g, mx_g = float(gn.min()), float(gn.max())
    michelson = (mx_g - mn_g) / (mx_g + mn_g + 1e-10)
    rms_c     = float(np.sqrt(np.mean((gn - float(gn.mean()))**2)))
    k7 = min(7, h, w); k7 = k7 if k7 % 2 == 1 else max(1, k7-1)
    blurred = cv2.GaussianBlur(gn.astype(np.float32), (k7, k7), 0).astype(np.float64)
    local_c = float(np.mean(np.abs(gn - blurred)))

    # ── Noise ──
    k5 = min(5, h, w); k5 = k5 if k5 % 2 == 1 else max(1, k5-1)
    blur5 = cv2.GaussianBlur(g.astype(np.float32), (k5, k5), 0).astype(np.float64)
    res = np.abs(g - blur5)
    mad = float(np.median(np.abs(res - float(np.median(res)))))
    noise_std = mad * 1.4826 / mv * 100  # as % of full scale
    snr_db = round(20.0 * math.log10(max(float(gn.mean()), 1e-6) / max(float(gn.std()), 1e-6) + 1e-10), 2)

    # ── Entropy ──
    hist, _ = np.histogram(g.flatten(), bins=256, range=(0, mv))
    prob = hist / float(hist.sum() + 1e-10)
    prob = prob[prob > 0]
    entropy = float(-np.sum(prob * np.log2(prob)))

    # ── Colorfulness ──
    colorfulness: Optional[float] = None
    if is_color:
        b_ch, g_ch, r_ch = img_bgr[:,:,0].astype(float), img_bgr[:,:,1].astype(float), img_bgr[:,:,2].astype(float)
        rg = r_ch - g_ch
        yb = 0.5*(r_ch + g_ch) - b_ch
        colorfulness = round(float(math.sqrt(rg.std()**2 + yb.std()**2) + 0.3*math.sqrt(rg.mean()**2 + yb.mean()**2)), 3)

    # ── Histograms ──
    bins = 64
    bvals = [float(v) for v in np.linspace(0, mv, bins).tolist()]
    hg_raw, _ = np.histogram(g.flatten(), bins=bins, range=(0, mv))
    h_gray = [float(v) for v in hg_raw.tolist()]
    h_r = h_gg = h_b = None
    if is_color:
        hr, _ = np.histogram(img_bgr[:,:,2].flatten(), bins=bins, range=(0, mv))
        hg2, _ = np.histogram(img_bgr[:,:,1].flatten(), bins=bins, range=(0, mv))
        hb, _  = np.histogram(img_bgr[:,:,0].flatten(), bins=bins, range=(0, mv))
        h_r = [float(v) for v in hr.tolist()]
        h_gg = [float(v) for v in hg2.tolist()]
        h_b = [float(v) for v in hb.tolist()]

    # ── Heatmaps ──
    fm_raw = _focus_map(g, block=max(8, min(32, min(h, w) // 8)))
    fm_data, fm_rows, fm_cols = _downsample_map(fm_raw)

    nm_raw = _noise_map(g, block=max(8, min(32, min(h, w) // 8)))
    nm_data, nm_rows, nm_cols = _downsample_map(nm_raw)

    return dict(
        index=index, name=name, width=int(w), height=int(h), is_color=is_color,
        laplacian_variance=round(lap_var, 4), tenengrad=round(tenengrad, 4),
        brenner=round(brenner, 4), fft_sharpness=round(fft_sharp, 6),
        edge_density=round(edge_dens, 6), sobel_energy=round(sobel_e, 4),
        mean_brightness=round(mean_b, 3), median_brightness=round(median_b, 3),
        std_brightness=round(std_b, 3), dynamic_range_pct=round(dyn_r, 3),
        michelson=round(michelson, 6), rms_contrast=round(rms_c, 6),
        local_contrast=round(local_c, 6),
        noise_std=round(noise_std, 6), snr_db=snr_db,
        entropy=round(entropy, 4), colorfulness=colorfulness,
        histogram_bins=bvals, histogram_gray=h_gray,
        histogram_r=h_r, histogram_g=h_gg, histogram_b=h_b,
        focus_map=fm_data, focus_map_rows=fm_rows, focus_map_cols=fm_cols,
        noise_map=nm_data, noise_map_rows=nm_rows, noise_map_cols=nm_cols,
    )


# ── pairwise diff ──────────────────────────────────────────────────────────────

def _compute_diff(imgs: list[np.ndarray], idx1: int, idx2: int) -> DiffResult:
    img1, img2 = imgs[idx1], imgs[idx2]
    if img1.shape != img2.shape:
        h = min(img1.shape[0], img2.shape[0])
        w = min(img1.shape[1], img2.shape[1])
        img1 = img1[:h, :w] if img1.ndim == 2 else img1[:h, :w, :]
        img2 = img2[:h, :w] if img2.ndim == 2 else img2[:h, :w, :]

    g1 = _to_gray(img1).astype(np.float64)
    g2 = _to_gray(img2).astype(np.float64)
    mv = _max_val(img1)

    diff = np.abs(g1 - g2)
    mse  = float(np.mean((g1 - g2)**2))
    psnr = round(10 * math.log10(mv**2 / max(mse, 1e-10)), 3) if mse > 1e-10 else 100.0

    # SSIM
    ssim_val: Optional[float] = None
    try:
        from skimage.metrics import structural_similarity
        ssim_val = round(float(structural_similarity(g1, g2, data_range=mv)), 4)
    except Exception:
        C1, C2 = (0.01*mv)**2, (0.03*mv)**2
        mu1, mu2 = float(g1.mean()), float(g2.mean())
        s1, s2 = float(g1.std())**2, float(g2.std())**2
        s12 = float(np.cov(g1.flatten(), g2.flatten())[0, 1])
        ssim_val = round(((2*mu1*mu2+C1)*(2*s12+C2)) / ((mu1**2+mu2**2+C1)*(s1+s2+C2)), 4)

    dm_data, dm_rows, dm_cols = _downsample_map(diff.astype(np.float32))
    return DiffResult(
        img1_idx=idx1, img2_idx=idx2, mse=round(mse, 4), psnr=psnr, ssim=ssim_val,
        diff_map=dm_data, diff_map_rows=dm_rows, diff_map_cols=dm_cols,
    )


# ── main orchestrator ──────────────────────────────────────────────────────────

def run_comparison(
    images: list[np.ndarray],
    names: list[str],
    weights: dict[str, float],
) -> ComparisonResult:
    n = len(images)
    raw = [_compute_metrics(img, i, names[i]) for i, img in enumerate(images)]

    # Normalise scores within batch
    laps     = _normalize([r["laplacian_variance"] for r in raw])
    brights  = _normalize([abs(r["mean_brightness"] - 50) for r in raw], higher_is_better=False)
    conts    = _normalize([r["rms_contrast"] for r in raw])
    noises   = _normalize([r["noise_std"] for r in raw], higher_is_better=False)
    entropys = _normalize([r["entropy"] for r in raw])

    # Normalise weights
    w_total = sum(weights.values()) or 1.0
    wn = {k: v / w_total for k, v in weights.items()}
    ws  = wn.get("sharpness", 0.4)
    wn_ = wn.get("noise", 0.2)
    wc  = wn.get("contrast", 0.2)
    wb  = wn.get("brightness", 0.1)
    we  = wn.get("entropy", 0.1)

    metrics: list[ImageMetrics] = []
    for i, r in enumerate(raw):
        overall = ws*laps[i] + wn_*noises[i] + wc*conts[i] + wb*brights[i] + we*entropys[i]
        metrics.append(ImageMetrics(
            **{k: v for k, v in r.items() if k not in {"sobel_energy"}},
            sharpness_score=round(laps[i], 1),
            brightness_score=round(brights[i], 1),
            contrast_score=round(conts[i], 1),
            noise_score=round(noises[i], 1),
            overall_score=round(overall, 1),
            rank=0,  # set below
        ))

    # Rankings
    sharp_rank = sorted(range(n), key=lambda i: metrics[i].laplacian_variance, reverse=True)
    bright_rank = sorted(range(n), key=lambda i: abs(metrics[i].mean_brightness - 50))
    cont_rank  = sorted(range(n), key=lambda i: metrics[i].rms_contrast, reverse=True)
    noise_rank = sorted(range(n), key=lambda i: metrics[i].noise_std)
    overall_rank = sorted(range(n), key=lambda i: metrics[i].overall_score, reverse=True)

    for pos, idx in enumerate(overall_rank):
        metrics[idx].rank = pos + 1

    best_idx  = overall_rank[0]
    worst_idx = overall_rank[-1]

    diff_result: Optional[DiffResult] = None
    if n == 2:
        diff_result = _compute_diff(images, 0, 1)

    return ComparisonResult(
        n_images=n, metrics=metrics,
        sharpness_ranking=sharp_rank,
        brightness_ranking=bright_rank,
        contrast_ranking=cont_rank,
        noise_ranking=noise_rank,
        overall_ranking=overall_rank,
        best_idx=best_idx, worst_idx=worst_idx,
        diff_result=diff_result,
        weights_used={k: round(v, 4) for k, v in wn.items()},
    )
