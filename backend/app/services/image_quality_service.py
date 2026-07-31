"""Image Quality Evaluation service — objective CV metrics."""
from __future__ import annotations

import math
from typing import Optional

import cv2
import numpy as np

from app.schemas.image_quality import (
    ApplicationScores,
    BlurResult,
    ColorResult,
    ContrastResult,
    DynamicRangeQuality,
    ExposureResult,
    ImageQualityResult,
    ImageStatistics,
    NoiseQualityResult,
    SNRCNRResult,
    SharpnessResult,
)


# ── shared helpers ─────────────────────────────────────────────────────────────

def _to_gray(img: np.ndarray) -> np.ndarray:
    if img.ndim == 3 and img.shape[2] == 4:
        return cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
    if img.ndim == 3:
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return img


def _bit_depth(img: np.ndarray) -> int:
    if img.dtype == np.uint16:
        return 16
    if img.dtype == np.uint32:
        return 32
    return 8


def _safe_k(size: int, h: int, w: int) -> int:
    k = min(size, h, w)
    return k if k % 2 == 1 else max(1, k - 1)


def _downsample(data: np.ndarray, max_side: int = 64) -> tuple[list[list[float]], int, int]:
    data = data.astype(np.float32)
    h, w = data.shape
    if max(h, w) > max_side:
        scale = max_side / max(h, w)
        nw = max(1, int(w * scale))
        nh = max(1, int(h * scale))
        data = cv2.resize(data, (nw, nh), interpolation=cv2.INTER_AREA)
    # Convert to Python float for JSON serialization
    result = [[float(v) for v in row] for row in data.tolist()]
    return result, int(data.shape[0]), int(data.shape[1])


# ── component scores ───────────────────────────────────────────────────────────

def _lap_to_score(lap_var: float) -> float:
    if lap_var <= 0:
        return 0.0
    return float(min(100.0, 20.0 * math.log10(max(lap_var, 1.0))))


def _noise_to_score(std: float, max_val: float) -> float:
    pct = std / max_val * 100
    if pct < 0.3:   return 98.0
    if pct < 0.8:   return 90.0
    if pct < 2.0:   return 78.0
    if pct < 5.0:   return 55.0
    return max(0.0, 100.0 - pct * 4.0)


def _contrast_to_score(rms: float) -> float:
    return float(min(100.0, rms * 400.0))


def _snr_to_score(snr_db: float) -> float:
    return float(min(100.0, max(0.0, snr_db * 2.0)))


# ── analysis modules ───────────────────────────────────────────────────────────

def analyze_sharpness(gray: np.ndarray, max_val: float) -> SharpnessResult:
    g = gray.astype(np.float64)
    h, w = g.shape

    # Laplacian variance
    lap = cv2.Laplacian(g, cv2.CV_64F)
    lap_var = float(lap.var())

    # Tenengrad (Sobel energy mean)
    ksize = _safe_k(3, h, w)
    gx = cv2.Sobel(g, cv2.CV_64F, 1, 0, ksize=ksize)
    gy = cv2.Sobel(g, cv2.CV_64F, 0, 1, ksize=ksize)
    tenengrad = float(np.mean(gx ** 2 + gy ** 2))

    # Brenner (forward difference squared)
    if h > 2:
        brenner = float(np.mean((g[2:, :] - g[:-2, :]) ** 2))
    else:
        brenner = 0.0

    # Sobel energy
    sobel_energy = float(np.mean(np.sqrt(gx ** 2 + gy ** 2 + 1e-10)))

    # FFT sharpness — ratio of high-frequency energy
    fft2 = np.fft.fftshift(np.fft.fft2(g))
    magnitude = np.abs(fft2)
    cy, cx = h // 2, w // 2
    y_idx, x_idx = np.ogrid[:h, :w]
    r = np.sqrt((y_idx - cy) ** 2 + (x_idx - cx) ** 2)
    low_r = min(h, w) / 8.0
    hi_mask = r > low_r
    total = float(magnitude.sum()) + 1e-10
    fft_sharpness = float(magnitude[hi_mask].sum()) / total

    # Focus map — block Laplacian variance
    block = max(8, min(32, min(h, w) // 8))
    rows_b = max(1, h // block)
    cols_b = max(1, w // block)
    fmap = np.zeros((rows_b, cols_b), dtype=np.float32)
    for r_i in range(rows_b):
        for c_i in range(cols_b):
            blk = g[r_i * block:(r_i + 1) * block, c_i * block:(c_i + 1) * block]
            lap_blk = cv2.Laplacian(blk, cv2.CV_64F)
            fmap[r_i, c_i] = float(lap_blk.var())
    fm_data, fm_rows, fm_cols = _downsample(fmap)

    score = _lap_to_score(lap_var)
    status = "sharp" if lap_var >= 1000 else ("acceptable" if lap_var >= 100 else "blurry")

    return SharpnessResult(
        laplacian_variance=round(lap_var, 2),
        tenengrad=round(tenengrad, 2),
        brenner=round(brenner, 2),
        sobel_energy=round(sobel_energy, 2),
        fft_sharpness=round(fft_sharpness, 4),
        sharpness_score=round(score, 1),
        status=status,
        focus_map=fm_data,
        focus_map_rows=fm_rows,
        focus_map_cols=fm_cols,
    )


def analyze_blur(gray: np.ndarray, lap_var: float) -> BlurResult:
    g = gray.astype(np.float64)
    h, w = g.shape

    # Severity from Laplacian variance
    if lap_var > 1000:
        severity = 0.0
        blur_type = "none"
    elif lap_var > 200:
        severity = round(1.0 - math.log10(lap_var) / math.log10(1000), 3)
        blur_type = "slight"
    elif lap_var > 30:
        severity = round(0.5 + 0.4 * (1 - (lap_var - 30) / 170), 3)
        blur_type = "moderate"
    else:
        severity = 0.95
        blur_type = "severe"

    motion_angle: Optional[float] = None
    motion_length: Optional[float] = None

    # Check for motion vs defocus via FFT directionality
    if blur_type != "none" and lap_var < 500:
        fft2 = np.fft.fftshift(np.fft.fft2(g))
        mag = np.abs(fft2)
        cy, cx = h // 2, w // 2
        grids = np.mgrid[:h, :w]
        y_idx = grids[0].astype(np.float64)
        x_idx = grids[1].astype(np.float64)
        y_idx -= cy; x_idx -= cx
        r_map = np.sqrt(y_idx ** 2 + x_idx ** 2)
        a_map = np.degrees(np.arctan2(y_idx, x_idx))

        # Build 36-bin angle histogram weighted by magnitude (exclude DC)
        dc_mask = r_map > max(3, min(h, w) // 16)
        a_hist = np.zeros(36)
        for i in range(36):
            a0 = -90 + i * 5
            mask = (a_map >= a0) & (a_map < a0 + 5) & dc_mask
            a_hist[i] = float(mag[mask].sum()) if mask.any() else 0.0
        if a_hist.sum() > 0:
            a_hist /= a_hist.sum()

        # If very strong peak → motion blur
        a_std = float(a_hist.std())
        if a_std < 0.025:
            blur_type = "motion"
            dom = int(np.argmax(a_hist))
            motion_angle = round(float(-90 + dom * 5 + 2.5), 1)
            motion_length = round(max(2.0, 400.0 / (lap_var + 1)), 1)
        else:
            blur_type = "defocus"

    # Blur map — inverse of focus map (local sharpness)
    block = max(8, min(32, min(h, w) // 8))
    rb = max(1, h // block); cb = max(1, w // block)
    bmap = np.zeros((rb, cb), dtype=np.float32)
    for ri in range(rb):
        for ci in range(cb):
            blk = g[ri * block:(ri + 1) * block, ci * block:(ci + 1) * block]
            lb = cv2.Laplacian(blk, cv2.CV_64F)
            bmap[ri, ci] = float(lb.var())
    bmap_inv = float(bmap.max() + 1) - bmap  # Invert: high = blurry
    bm_data, bm_rows, bm_cols = _downsample(bmap_inv)

    return BlurResult(
        blur_type=blur_type,
        severity_score=round(severity, 3),
        motion_angle=motion_angle,
        motion_length=motion_length,
        blur_map=bm_data,
        blur_map_rows=bm_rows,
        blur_map_cols=bm_cols,
    )


def analyze_noise_quality(
    gray: np.ndarray,
    extra_frames: Optional[list[np.ndarray]],
    max_val: float,
) -> NoiseQualityResult:
    g = gray.astype(np.float64)
    h, w = g.shape

    # Gaussian noise estimation via smooth-region residual (MAD method)
    k = _safe_k(5, h, w)
    blurred = cv2.GaussianBlur(g.astype(np.float32), (k, k), 0).astype(np.float64)
    residual = np.abs(g - blurred)
    mad = float(np.median(np.abs(residual - float(np.median(residual)))))
    estimated_std = mad * 1.4826  # Convert MAD → σ

    # Salt & pepper
    sp_pct = round(
        (float(np.sum(g >= max_val * 0.98)) + float(np.sum(g <= max_val * 0.02)))
        / g.size * 100,
        3,
    )

    score = round(_noise_to_score(estimated_std, max_val), 1)

    # Noise map
    nm_data, nm_rows, nm_cols = _downsample(residual)

    return NoiseQualityResult(
        estimated_std=round(estimated_std, 4),
        salt_pepper_pct=sp_pct,
        noise_score=score,
        noise_map=nm_data,
        noise_map_rows=nm_rows,
        noise_map_cols=nm_cols,
    )


def analyze_contrast(gray: np.ndarray, max_val: float) -> ContrastResult:
    norm = gray.astype(np.float64) / max_val
    mn, mx = float(norm.min()), float(norm.max())
    mean = float(norm.mean())
    h, w = gray.shape

    # Michelson contrast
    michelson = (mx - mn) / (mx + mn + 1e-10)

    # RMS contrast
    rms = float(np.sqrt(np.mean((norm - mean) ** 2)))

    # Local contrast
    k = _safe_k(7, h, w)
    blur = cv2.GaussianBlur(norm.astype(np.float32), (k, k), 0).astype(np.float64)
    local_c = float(np.mean(np.abs(norm - blur)))

    # Histogram spread (5th–95th percentile range)
    p5, p95 = float(np.percentile(gray, 5)), float(np.percentile(gray, 95))
    spread = (p95 - p5) / max_val

    score = round(_contrast_to_score(rms), 1)
    status = "high" if rms > 0.2 else ("medium" if rms > 0.08 else "low")

    return ContrastResult(
        michelson=round(michelson, 4),
        rms=round(rms, 4),
        local_mean=round(local_c, 4),
        histogram_spread=round(spread, 4),
        contrast_score=score,
        status=status,
    )


def analyze_dynamic_range_quality(gray: np.ndarray, max_val: float) -> DynamicRangeQuality:
    flat = gray.flatten().astype(np.float64)
    n = float(flat.size)
    saturated_pct = round(float(np.sum(flat >= max_val * 0.99)) / n * 100, 3)
    shadow_pct = round(float(np.sum(flat <= max_val * 0.01)) / n * 100, 3)
    highlight_pct = round(float(np.sum(flat >= max_val * 0.98)) / n * 100, 3)

    hist, _ = np.histogram(flat, bins=256, range=(0, max_val))
    used = int(np.sum(hist > 0))
    effective_pct = round(used / 256.0 * 100, 1)
    dr_stops = round(math.log2(max(used, 1)), 2)

    return DynamicRangeQuality(
        dynamic_range_stops=dr_stops,
        saturated_pct=saturated_pct,
        shadow_clipped_pct=shadow_pct,
        highlight_clipped_pct=highlight_pct,
        effective_range_pct=effective_pct,
    )


def analyze_snr_cnr(gray: np.ndarray, max_val: float) -> SNRCNRResult:
    g = gray.astype(np.float64)
    h, w = g.shape

    # SNR: mean / std
    signal = float(np.mean(g))
    noise = max(float(np.std(g)), 1e-6)
    snr_db = round(20.0 * math.log10(signal / noise + 1e-10), 2)

    # CNR: (center_mean - corner_mean) / corner_std
    cs = max(1, min(h, w) // 8)
    cy, cx = h // 2, w // 2
    center = g[cy - cs: cy + cs, cx - cs: cx + cs]
    corners = np.concatenate([
        g[:cs, :cs].flatten(),
        g[:cs, -cs:].flatten(),
        g[-cs:, :cs].flatten(),
        g[-cs:, -cs:].flatten(),
    ])
    cnr_raw = abs(float(np.mean(center)) - float(np.mean(corners))) / max(float(np.std(corners)), 1e-6)
    cnr_db = round(20.0 * math.log10(max(cnr_raw, 1e-10)), 2)

    score = round(_snr_to_score(snr_db), 1)
    status = "excellent" if snr_db >= 40 else ("good" if snr_db >= 25 else "poor")

    return SNRCNRResult(snr_db=snr_db, cnr_db=cnr_db, snr_score=score, status=status)


def analyze_exposure(gray: np.ndarray, max_val: float) -> ExposureResult:
    flat = gray.flatten().astype(np.float64)
    n = float(flat.size)
    mean = float(np.mean(flat))
    pct = mean / max_val * 100

    # Score peaks at 50% brightness
    exp_score = round(max(0.0, 100.0 - abs(pct - 50.0) * 2.5), 1)

    low_thresh = max_val * 0.03
    high_thresh = max_val * 0.97
    under_pct = round(float(np.sum(flat < low_thresh)) / n * 100, 2)
    over_pct = round(float(np.sum(flat > high_thresh)) / n * 100, 2)

    is_under = under_pct > 10.0 or pct < 10.0
    is_over = over_pct > 2.0 or pct > 90.0

    if is_over or is_under:
        status = "fail" if (over_pct > 10 or under_pct > 30 or pct < 5 or pct > 95) else "warning"
    else:
        status = "pass"

    return ExposureResult(
        mean_brightness_pct=round(pct, 2),
        exposure_score=exp_score,
        is_overexposed=is_over,
        is_underexposed=is_under,
        overexposed_pct=over_pct,
        underexposed_pct=under_pct,
        status=status,
    )


def analyze_color(img: np.ndarray, bit_depth: int) -> Optional[ColorResult]:
    if img.ndim < 3:
        return None

    max_val = float(2 ** bit_depth - 1)
    bins = 64

    if img.shape[2] == 4:
        b_ch, g_ch, r_ch = img[:, :, 0], img[:, :, 1], img[:, :, 2]
    else:
        b_ch, g_ch, r_ch = img[:, :, 0], img[:, :, 1], img[:, :, 2]

    def _hist(ch: np.ndarray) -> list[float]:
        h, _ = np.histogram(ch.flatten(), bins=bins, range=(0, max_val))
        return [float(v) for v in h]

    bin_edges = np.linspace(0, max_val, bins + 1)
    bin_centres = [float(v) for v in ((bin_edges[:-1] + bin_edges[1:]) / 2).tolist()]

    mean_r = float(np.mean(r_ch))
    mean_g = float(np.mean(g_ch))
    mean_b = float(np.mean(b_ch))
    total = mean_r + mean_g + mean_b + 1e-10

    r_ratio = mean_r / total
    g_ratio = mean_g / total
    b_ratio = mean_b / total
    ideal = 1.0 / 3.0
    deviation = max(abs(r_ratio - ideal), abs(g_ratio - ideal), abs(b_ratio - ideal))
    wb_score = round(max(0.0, 100.0 - deviation * 300.0), 1)
    has_cast = deviation > 0.07

    cast: Optional[str] = None
    if has_cast:
        cast = "red" if r_ratio > g_ratio and r_ratio > b_ratio else (
            "green" if g_ratio > r_ratio and g_ratio > b_ratio else "blue"
        )

    return ColorResult(
        histogram_bins=bin_centres,
        histogram_r=_hist(r_ch),
        histogram_g=_hist(g_ch),
        histogram_b=_hist(b_ch),
        mean_r=round(mean_r, 2),
        mean_g=round(mean_g, 2),
        mean_b=round(mean_b, 2),
        white_balance_score=wb_score,
        has_color_cast=has_cast,
        dominant_cast=cast,
    )


def compute_statistics(gray: np.ndarray, max_val: float) -> ImageStatistics:
    flat = gray.astype(np.float64).flatten()
    mean = float(flat.mean())
    std = max(float(flat.std()), 1e-10)

    # Entropy
    hist, _ = np.histogram(flat, bins=256, range=(0, max_val))
    prob = hist / float(hist.sum() + 1e-10)
    prob = prob[prob > 0]
    entropy = float(-np.sum(prob * np.log2(prob)))

    # Skewness and kurtosis (manual, avoids scipy)
    norm = (flat - mean) / std
    skewness = float(np.mean(norm ** 3))
    kurtosis = float(np.mean(norm ** 4) - 3.0)

    return ImageStatistics(
        mean=round(mean, 3),
        median=round(float(np.median(flat)), 3),
        std=round(float(flat.std()), 3),
        variance=round(float(flat.var()), 3),
        entropy=round(entropy, 4),
        skewness=round(skewness, 4),
        kurtosis=round(kurtosis, 4),
        min_val=round(float(flat.min()), 3),
        max_val=round(float(flat.max()), 3),
        percentile_5=round(float(np.percentile(flat, 5)), 3),
        percentile_95=round(float(np.percentile(flat, 95)), 3),
    )


def _app_scores(
    s_sharp: float, s_noise: float, s_contrast: float,
    s_exposure: float, s_snr: float,
) -> ApplicationScores:
    def _w(weights: list[float]) -> float:
        scores = [s_sharp, s_noise, s_contrast, s_exposure, s_snr]
        return round(sum(w * s for w, s in zip(weights, scores)), 1)

    return ApplicationScores(
        ai_inspection=  _w([0.25, 0.25, 0.25, 0.15, 0.10]),
        ocr=            _w([0.45, 0.15, 0.20, 0.15, 0.05]),
        measurement=    _w([0.45, 0.20, 0.10, 0.15, 0.10]),
        object_detection=_w([0.25, 0.15, 0.30, 0.20, 0.10]),
        defect_detection=_w([0.35, 0.25, 0.20, 0.10, 0.10]),
        pattern_matching=_w([0.40, 0.15, 0.20, 0.15, 0.10]),
    )


def _generate_recommendations(
    sharpness: SharpnessResult,
    noise: NoiseQualityResult,
    contrast: ContrastResult,
    snr_cnr: SNRCNRResult,
    exposure: ExposureResult,
    app: ApplicationScores,
) -> list[str]:
    recs: list[str] = []

    if sharpness.sharpness_score < 50:
        recs += [
            f"Image is {sharpness.status} (Laplacian={sharpness.laplacian_variance:.0f}) — check focus and lens",
            "Use shorter exposure or trigger strobe to reduce motion blur",
            "Verify object is within depth of field",
        ]
    if noise.noise_score < 60:
        recs += [
            f"High noise (σ={noise.estimated_std:.2f}) — reduce camera gain/ISO",
            "Increase illumination to lower required exposure",
            "Use frame averaging to reduce temporal noise",
        ]
    if noise.salt_pepper_pct > 0.5:
        recs.append(f"Salt & pepper noise ({noise.salt_pepper_pct:.2f}%) — apply median filter or check sensor")
    if contrast.status == "low":
        recs += [
            "Low contrast — improve lighting setup or adjust F-number",
            "Consider brightfield/darkfield illumination for the application",
        ]
    if snr_cnr.status == "poor":
        recs.append(f"Poor SNR ({snr_cnr.snr_db:.1f} dB) — increase illumination or reduce gain")
    if exposure.is_overexposed:
        recs.append(f"Overexposed ({exposure.overexposed_pct:.1f}% pixels) — reduce exposure time or LED intensity")
    if exposure.is_underexposed:
        recs.append(f"Underexposed ({exposure.underexposed_pct:.1f}% pixels) — increase illumination or exposure time")

    # Application-specific
    if app.ocr < 70:
        recs.append(f"OCR readiness low ({app.ocr:.0f}/100) — improve sharpness and contrast")
    if app.measurement < 75:
        recs.append(f"Measurement accuracy limited ({app.measurement:.0f}/100) — improve sharpness")
    if app.defect_detection < 70:
        recs.append(f"Defect detection limited ({app.defect_detection:.0f}/100) — reduce noise and improve sharpness")

    return recs if recs else ["Image quality is excellent — suitable for all machine vision applications"]


# ── public entry point ─────────────────────────────────────────────────────────

def run_quality_analysis(images: list[np.ndarray]) -> ImageQualityResult:
    primary = images[0]
    bit_depth_ = _bit_depth(primary)
    max_val = float(2 ** bit_depth_ - 1)
    gray = _to_gray(primary)
    is_color = primary.ndim == 3 and primary.shape[2] >= 3

    sharpness = analyze_sharpness(gray, max_val)
    blur = analyze_blur(gray, sharpness.laplacian_variance)
    noise = analyze_noise_quality(gray, images[1:] if len(images) > 1 else None, max_val)
    contrast = analyze_contrast(gray, max_val)
    dyn_range = analyze_dynamic_range_quality(gray, max_val)
    snr_cnr = analyze_snr_cnr(gray, max_val)
    exposure = analyze_exposure(gray, max_val)
    color = analyze_color(primary, bit_depth_) if is_color else None
    stats = compute_statistics(gray, max_val)

    s_sharp = sharpness.sharpness_score
    s_noise = noise.noise_score
    s_contrast = contrast.contrast_score
    s_exposure = exposure.exposure_score
    s_snr = snr_cnr.snr_score

    app = _app_scores(s_sharp, s_noise, s_contrast, s_exposure, s_snr)
    overall = round(s_sharp * 0.25 + s_noise * 0.20 + s_contrast * 0.20 + s_exposure * 0.20 + s_snr * 0.15, 1)
    category = "Excellent" if overall >= 85 else "Good" if overall >= 65 else "Acceptable" if overall >= 45 else "Poor"
    recs = _generate_recommendations(sharpness, noise, contrast, snr_cnr, exposure, app)

    return ImageQualityResult(
        is_color=is_color,
        image_shape=[int(primary.shape[0]), int(primary.shape[1])],
        bit_depth=bit_depth_,
        overall_score=overall,
        quality_category=category,
        sharpness=sharpness,
        blur=blur,
        noise=noise,
        contrast=contrast,
        dynamic_range=dyn_range,
        snr_cnr=snr_cnr,
        exposure=exposure,
        color=color,
        statistics=stats,
        application_scores=app,
        recommendations=recs,
    )
