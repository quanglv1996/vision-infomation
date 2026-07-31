"""Lighting calibration analysis service."""
from __future__ import annotations

import math
from typing import Optional

import cv2
import numpy as np
from numpy import fft

from app.schemas.lighting import (
    BrightnessStats,
    DynamicRangeResult,
    FlickerResult,
    HistogramResult,
    HotspotInfo,
    HotspotResult,
    LightingAnalysisResult,
    NoiseResult,
    SNRResult,
    UniformityResult,
)


# ── helpers ───────────────────────────────────────────────────────────────────

def _to_gray(img: np.ndarray) -> np.ndarray:
    if img.ndim == 3 and img.shape[2] == 4:
        return cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
    if img.ndim == 3:
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return img


def _detect_bit_depth(img: np.ndarray) -> int:
    if img.dtype == np.uint16:
        return 16
    if img.dtype == np.uint32:
        return 32
    return 8


def _downsample(data: np.ndarray, max_size: int = 64) -> tuple[list[list[float]], int, int]:
    data = data.astype(np.float32)
    h, w = data.shape
    if h > max_size or w > max_size:
        scale = max_size / max(h, w)
        nw = max(1, int(w * scale))
        nh = max(1, int(h * scale))
        data = cv2.resize(data, (nw, nh), interpolation=cv2.INTER_AREA)
    return data.tolist(), int(data.shape[0]), int(data.shape[1])


def _safe_kernel(size: int, img_h: int, img_w: int) -> int:
    """Return odd kernel size ≤ image dimensions."""
    k = min(size, img_h, img_w)
    return k if k % 2 == 1 else max(1, k - 1)


# ── analysis modules ──────────────────────────────────────────────────────────

def analyze_brightness(gray_imgs: list[np.ndarray], max_val: float) -> BrightnessStats:
    mean_img = np.mean(np.stack(gray_imgs, axis=0), axis=0)
    flat = mean_img.flatten()
    mean = float(np.mean(flat))
    pct = mean / max_val * 100

    if 20 <= pct <= 80:
        status = "pass"
    elif 10 <= pct < 20 or 80 < pct <= 90:
        status = "warning"
    else:
        status = "fail"

    return BrightnessStats(
        mean=round(mean, 3),
        median=round(float(np.median(flat)), 3),
        min_val=round(float(flat.min()), 3),
        max_val=round(float(flat.max()), 3),
        std=round(float(np.std(flat)), 3),
        pct_of_full_scale=round(pct, 2),
        status=status,
    )


def analyze_histogram(gray_imgs: list[np.ndarray], max_val: float) -> HistogramResult:
    mean_img = np.mean(np.stack(gray_imgs, axis=0), axis=0)
    flat = mean_img.flatten()
    hist, edges = np.histogram(flat, bins=256, range=(0.0, max_val))
    bin_centres = ((edges[:-1] + edges[1:]) / 2).tolist()
    total = float(flat.size)
    counts = (hist / total * 100).tolist()

    low_thresh = max_val * 0.05
    high_thresh = max_val * 0.98
    under_pct = round(float(np.sum(flat < low_thresh)) / total * 100, 2)
    over_pct = round(float(np.sum(flat > high_thresh)) / total * 100, 2)

    return HistogramResult(
        bins=bin_centres,
        counts=counts,
        underexposed_pct=under_pct,
        overexposed_pct=over_pct,
        clipping_low=under_pct > 5.0,
        clipping_high=over_pct > 1.0,
        peak_bin=int(np.argmax(hist)),
    )


def analyze_uniformity(gray_imgs: list[np.ndarray]) -> UniformityResult:
    mean_img = np.mean(np.stack(gray_imgs, axis=0), axis=0)
    m = float(np.mean(mean_img))
    mn = float(mean_img.min())
    mx = float(mean_img.max())
    std = float(np.std(mean_img))

    u_mm = (mn / mx * 100) if mx > 0 else 0.0
    u_cv = ((1.0 - std / m) * 100) if m > 0 else 0.0

    if u_mm >= 95:
        status = "excellent"
    elif u_mm >= 90:
        status = "good"
    elif u_mm >= 80:
        status = "acceptable"
    else:
        status = "bad"

    hmap, rows, cols = _downsample(mean_img)
    return UniformityResult(
        uniformity_min_max=round(u_mm, 2),
        uniformity_cv=round(u_cv, 2),
        status=status,
        heatmap_data=hmap,
        heatmap_rows=rows,
        heatmap_cols=cols,
    )


def analyze_hotspots(gray_imgs: list[np.ndarray], max_val: float) -> HotspotResult:
    mean_img = np.mean(np.stack(gray_imgs, axis=0), axis=0).astype(np.float32)
    norm = (mean_img / max_val).astype(np.float32)
    h, w = norm.shape

    k = _safe_kernel(21, h, w)
    blurred = cv2.GaussianBlur(norm, (k, k), 0)

    mean_v = float(np.mean(norm))
    std_v = float(np.std(norm))
    hotspots: list[HotspotInfo] = []

    def _find_blobs(mask: np.ndarray, blob_type: str, base_val: float, nmax: int = 5):
        k2 = _safe_kernel(5, h, w)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((k2, k2), np.uint8))
        cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in cnts[:nmax]:
            x, y, bw, bh = cv2.boundingRect(cnt)
            roi_mean = float(np.mean(norm[y:y + bh, x:x + bw]))
            sev = min(1.0, abs(roi_mean - base_val) / (std_v + 1e-6))
            hotspots.append(HotspotInfo(x=x, y=y, width=bw, height=bh, severity=round(sev, 3), type=blob_type))

    bright_thresh = min(1.0, mean_v + 2.5 * std_v)
    _find_blobs((norm > bright_thresh).astype(np.uint8), "bright", mean_v)

    shadow_thresh = max(0.0, mean_v - 2.5 * std_v)
    _find_blobs((norm < shadow_thresh).astype(np.uint8), "shadow", mean_v)

    severity_score = round(float(np.mean([h_.severity for h_ in hotspots])), 3) if hotspots else 0.0
    hmap, rows, cols = _downsample(norm)

    return HotspotResult(
        hotspots=hotspots,
        severity_score=severity_score,
        heatmap_data=hmap,
        heatmap_rows=rows,
        heatmap_cols=cols,
    )


def analyze_noise(gray_imgs: list[np.ndarray]) -> tuple[NoiseResult, SNRResult]:
    arr = np.stack(gray_imgs, axis=0).astype(np.float64)
    mean_img = np.mean(arr, axis=0)
    h, w = mean_img.shape
    k = _safe_kernel(5, h, w)
    blurred = cv2.GaussianBlur(mean_img.astype(np.float32), (k, k), 0).astype(np.float64)
    spatial_noise = np.abs(mean_img - blurred)

    if len(gray_imgs) > 1:
        temporal_std_map = np.std(arr, axis=0)
        temporal_mean = float(np.mean(temporal_std_map))
        temporal_std = float(np.std(temporal_std_map))
        noise_map_arr = temporal_std_map
    else:
        temporal_mean = float(np.mean(spatial_noise))
        temporal_std = 0.0
        noise_map_arr = spatial_noise

    signal = float(np.mean(mean_img))
    noise = max(float(np.mean(spatial_noise)), 1e-6)
    snr_linear = signal / noise
    snr_db = 20 * math.log10(max(snr_linear, 1e-10))

    snr_status = "excellent" if snr_db >= 40 else ("good" if snr_db >= 25 else "poor")

    nm_data, nm_rows, nm_cols = _downsample(noise_map_arr)

    return (
        NoiseResult(
            spatial_mean=round(float(np.mean(spatial_noise)), 4),
            spatial_std=round(float(np.std(spatial_noise)), 4),
            temporal_mean=round(temporal_mean, 4),
            temporal_std=round(temporal_std, 4),
            noise_map=nm_data,
            noise_map_rows=nm_rows,
            noise_map_cols=nm_cols,
        ),
        SNRResult(snr_linear=round(snr_linear, 2), snr_db=round(snr_db, 2), status=snr_status),
    )


def analyze_flicker(gray_imgs: list[np.ndarray]) -> Optional[FlickerResult]:
    if len(gray_imgs) < 5:
        return None

    brightness = [float(np.mean(img)) for img in gray_imgs]
    n = len(brightness)
    mean_b = float(np.mean(brightness))
    std_b = float(np.std(brightness))
    flicker_pct = (std_b / mean_b * 100) if mean_b > 0 else 0.0

    signal = np.array(brightness) - mean_b
    yf = np.abs(fft.rfft(signal))
    xf = fft.rfftfreq(n, d=1.0).tolist()
    yf_norm = (yf / yf.max()).tolist() if yf.max() > 0 else yf.tolist()

    has_flicker = flicker_pct > 2.0
    freq_estimate: Optional[float] = None
    if has_flicker and len(xf) > 2:
        peak_idx = int(np.argmax(yf[1:])) + 1
        if peak_idx < len(xf):
            freq_estimate = round(float(xf[peak_idx]), 4)

    half = len(xf) // 2 or 1
    return FlickerResult(
        brightness_over_time=brightness,
        frame_indices=list(range(n)),
        mean=round(mean_b, 3),
        std=round(std_b, 4),
        has_flicker=has_flicker,
        flicker_pct=round(flicker_pct, 3),
        frequency_estimate=freq_estimate,
        fft_frequencies=xf[:half],
        fft_amplitudes=yf_norm[:half],
    )


def analyze_dynamic_range(
    gray_imgs: list[np.ndarray],
    dark_frame: Optional[np.ndarray],
    white_ref: Optional[np.ndarray],
) -> Optional[DynamicRangeResult]:
    if dark_frame is None or white_ref is None:
        return None

    dark = _to_gray(dark_frame).astype(np.float64)
    white = _to_gray(white_ref).astype(np.float64)
    noise_floor = max(float(np.std(dark)), 1e-6)
    signal_mean = float(np.mean(white)) - float(np.mean(dark))

    if signal_mean <= 0:
        return None

    effective = math.log2(signal_mean / noise_floor)
    return DynamicRangeResult(
        effective_dr_stops=round(effective, 2),
        usable_dr_stops=round(max(0.0, effective - 1.0), 2),
        signal_mean=round(signal_mean, 3),
        noise_floor=round(noise_floor, 4),
    )


def generate_recommendations(
    brightness: BrightnessStats,
    histogram: HistogramResult,
    uniformity: UniformityResult,
    hotspots: HotspotResult,
    snr: SNRResult,
    flicker: Optional[FlickerResult],
) -> list[str]:
    recs: list[str] = []

    if brightness.pct_of_full_scale < 20:
        recs += [
            "Brightness too low — increase exposure time",
            "Brightness too low — increase LED intensity",
            "Brightness too low — reduce F-number (open aperture)",
        ]
    elif brightness.pct_of_full_scale > 80:
        recs += [
            "Brightness too high — decrease exposure time",
            "Brightness too high — reduce LED intensity or gain",
            "Brightness too high — increase F-number (close aperture)",
        ]

    if histogram.clipping_high:
        recs.append(f"White clipping ({histogram.overexposed_pct:.1f}% pixels) — reduce exposure or gain")
    if histogram.clipping_low:
        recs.append(f"Black clipping ({histogram.underexposed_pct:.1f}% pixels) — increase illumination")

    if uniformity.status in ("bad", "acceptable"):
        recs += [
            f"Uniformity low ({uniformity.uniformity_min_max:.1f}%) — use a diffuser or dome light",
            "Uniformity low — check and adjust light source positioning",
            "Uniformity low — consider a telecentric lens with coaxial illumination",
        ]

    if hotspots.severity_score > 0.4:
        recs += [
            "Hotspot detected — add diffuser to scatter light",
            "Hotspot detected — use dome/dark-field illumination",
            "Hotspot detected — use a polarizer to remove specular reflections",
        ]

    if snr.status == "poor":
        recs += [
            f"SNR low ({snr.snr_db:.1f} dB) — reduce camera gain",
            "SNR low — increase illumination intensity",
            "SNR low — use longer exposure time",
        ]
    elif snr.status == "good":
        recs.append(f"SNR acceptable ({snr.snr_db:.1f} dB) — consider reducing gain further")

    if flicker and flicker.has_flicker:
        recs += [
            f"Flicker detected ({flicker.flicker_pct:.1f}% variation) — use DC power supply",
            "Flicker detected — synchronize camera trigger with light PWM",
        ]
        if flicker.frequency_estimate:
            recs.append(f"Estimated flicker frequency: {flicker.frequency_estimate} Hz — adjust trigger rate")

    return recs if recs else ["Lighting quality is excellent — no adjustments needed"]


def _overall_status(brightness: BrightnessStats, uniformity: UniformityResult, snr: SNRResult) -> str:
    if brightness.status == "fail" or uniformity.status == "bad" or snr.status == "poor":
        return "fail"
    if brightness.status == "warning" or uniformity.status in ("acceptable",) or snr.status == "good":
        return "warning"
    return "pass"


# ── public entry point ────────────────────────────────────────────────────────

def run_analysis(
    sequence: list[np.ndarray],
    white_ref: Optional[np.ndarray] = None,
    dark_frame: Optional[np.ndarray] = None,
) -> LightingAnalysisResult:
    # Normalise sizes to first frame
    target_h, target_w = sequence[0].shape[:2]
    sequence = [
        cv2.resize(img, (target_w, target_h)) if img.shape[:2] != (target_h, target_w) else img
        for img in sequence
    ]

    bit_depth = _detect_bit_depth(sequence[0])
    max_val = float(2 ** bit_depth - 1)

    # Convert to grayscale float64
    gray_imgs: list[np.ndarray] = [_to_gray(img).astype(np.float64) for img in sequence]

    # Dark frame subtraction
    if dark_frame is not None:
        dark_gray = _to_gray(dark_frame).astype(np.float64)
        if dark_gray.shape != (target_h, target_w):
            dark_gray = cv2.resize(dark_gray.astype(np.float32), (target_w, target_h)).astype(np.float64)
        gray_imgs = [np.clip(g - dark_gray, 0, max_val) for g in gray_imgs]

    brightness = analyze_brightness(gray_imgs, max_val)
    histogram = analyze_histogram(gray_imgs, max_val)
    uniformity = analyze_uniformity(gray_imgs)
    hotspots = analyze_hotspots(gray_imgs, max_val)
    noise, snr = analyze_noise(gray_imgs)
    flicker = analyze_flicker(gray_imgs)
    dynamic_range = analyze_dynamic_range(gray_imgs, dark_frame, white_ref)
    recommendations = generate_recommendations(brightness, histogram, uniformity, hotspots, snr, flicker)

    return LightingAnalysisResult(
        num_frames=len(sequence),
        image_shape=[target_h, target_w],
        bit_depth=bit_depth,
        brightness=brightness,
        histogram=histogram,
        uniformity=uniformity,
        hotspots=hotspots,
        noise=noise,
        snr=snr,
        flicker=flicker,
        dynamic_range=dynamic_range,
        recommendations=recommendations,
        overall_status=_overall_status(brightness, uniformity, snr),
    )
