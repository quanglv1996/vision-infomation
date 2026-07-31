"""Color Calibration service — white balance, Delta E, gamma, uniformity."""
from __future__ import annotations

import csv
import json
import math
from io import StringIO
from typing import Optional

import cv2
import numpy as np

from app.schemas.color_calibration import (
    ColorCalibrationResult,
    ColorCheckerResult,
    ColorPatch,
    ColorSpaceResult,
    ColorUniformityResult,
    GammaResult,
    GrayBalanceResult,
    SaturationResult,
    WhiteBalanceResult,
    WhitePointResult,
)

# ── Color science constants ────────────────────────────────────────────────────

# sRGB → XYZ D65 (IEC 61966-2-1)
_M_SRGB_XYZ = np.array([
    [0.4124564, 0.3575761, 0.1804375],
    [0.2126729, 0.7151522, 0.0721750],
    [0.0193339, 0.1191920, 0.9503041],
], dtype=np.float64)

_D65 = np.array([0.95047, 1.00000, 1.08883], dtype=np.float64)

# Macbeth ColorChecker Classic — standard sRGB values (D65 capture)
_CC_SRGB: list[tuple[int, int, int]] = [
    (115, 82, 68),   (194, 150, 130), (98, 122, 157),  (87, 108, 67),
    (133, 128, 177), (103, 189, 170), (214, 126, 44),   (80, 91, 166),
    (193, 90, 99),   (94, 60, 108),   (157, 188, 64),   (224, 163, 46),
    (56, 61, 150),   (70, 148, 73),   (175, 54, 60),    (231, 199, 31),
    (187, 86, 149),  (8, 133, 161),   (243, 243, 242),  (200, 200, 200),
    (160, 160, 160), (122, 122, 121), (85, 85, 85),     (52, 52, 52),
]

_CC_NAMES = [
    "Dark Skin", "Light Skin", "Blue Sky", "Foliage", "Blue Flower", "Bluish Green",
    "Orange", "Purplish Blue", "Moderate Red", "Purple", "Yellow Green", "Orange Yellow",
    "Blue", "Green", "Red", "Yellow", "Magenta", "Cyan",
    "White 9.5", "Neutral 8", "Neutral 6.5", "Neutral 5", "Neutral 3.5", "Black 2",
]

# ── Color space conversions ────────────────────────────────────────────────────

def _srgb_expand(v: np.ndarray) -> np.ndarray:
    """sRGB gamma expand: encoded → linear (0-1 → 0-1)."""
    return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)


def _to_float_rgb(img_bgr: np.ndarray) -> np.ndarray:
    """BGR uint8/uint16/float → float64 RGB 0-1."""
    if img_bgr.ndim == 2:
        img_bgr = cv2.cvtColor(img_bgr, cv2.COLOR_GRAY2BGR)
    mv = 65535.0 if img_bgr.dtype == np.uint16 else 255.0
    rgb = img_bgr[..., ::-1].astype(np.float64) / mv
    return np.clip(rgb, 0.0, 1.0)


def _rgb_to_xyz(rgb: np.ndarray) -> np.ndarray:
    """sRGB (0-1) → XYZ D65."""
    lin = _srgb_expand(rgb)
    return lin @ _M_SRGB_XYZ.T


def _xyz_to_lab(xyz: np.ndarray) -> np.ndarray:
    """XYZ D65 → CIELAB."""
    t = xyz / _D65
    eps, kap = 0.008856, 903.3

    def f(x: np.ndarray) -> np.ndarray:
        return np.where(x > eps, np.cbrt(x), (kap * x + 16.0) / 116.0)

    fx, fy, fz = f(t[..., 0]), f(t[..., 1]), f(t[..., 2])
    return np.stack([116.0 * fy - 16.0, 500.0 * (fx - fy), 200.0 * (fy - fz)], axis=-1)


def _rgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    return _xyz_to_lab(_rgb_to_xyz(rgb))


# ── Delta E formulas ───────────────────────────────────────────────────────────

def _de76(lab1: np.ndarray, lab2: np.ndarray) -> float:
    return float(np.linalg.norm(np.asarray(lab1) - np.asarray(lab2)))


def _de94(lab1: np.ndarray, lab2: np.ndarray) -> float:
    L1, a1, b1 = float(lab1[0]), float(lab1[1]), float(lab1[2])
    L2, a2, b2 = float(lab2[0]), float(lab2[1]), float(lab2[2])
    C1 = math.sqrt(a1**2 + b1**2)
    C2 = math.sqrt(a2**2 + b2**2)
    dC = C1 - C2
    dH2 = max(0.0, (a1-a2)**2 + (b1-b2)**2 - dC**2)
    SC = 1.0 + 0.045 * C1
    SH = 1.0 + 0.015 * C1
    return math.sqrt((L2-L1)**2 + (dC/SC)**2 + (math.sqrt(dH2)/SH)**2)


def _de2000(lab1: np.ndarray, lab2: np.ndarray) -> float:
    L1, a1, b1 = float(lab1[0]), float(lab1[1]), float(lab1[2])
    L2, a2, b2 = float(lab2[0]), float(lab2[1]), float(lab2[2])

    Cab = ((math.sqrt(a1**2+b1**2) + math.sqrt(a2**2+b2**2)) / 2.0)
    Cab7 = Cab**7
    G = 0.5 * (1.0 - math.sqrt(Cab7 / (Cab7 + 25.0**7)))

    a1p, a2p = a1*(1+G), a2*(1+G)
    C1p = math.sqrt(a1p**2 + b1**2)
    C2p = math.sqrt(a2p**2 + b2**2)
    h1p = math.degrees(math.atan2(b1, a1p)) % 360.0
    h2p = math.degrees(math.atan2(b2, a2p)) % 360.0

    dLp = L2 - L1
    dCp = C2p - C1p

    if C1p * C2p < 1e-14:
        dhp = 0.0
    elif abs(h2p - h1p) <= 180:
        dhp = h2p - h1p
    elif h2p - h1p > 180:
        dhp = h2p - h1p - 360.0
    else:
        dhp = h2p - h1p + 360.0
    dHp = 2.0 * math.sqrt(C1p * C2p) * math.sin(math.radians(dhp / 2.0))

    Lbp = (L1+L2)/2; Cbp = (C1p+C2p)/2
    if C1p*C2p < 1e-14:
        Hbp = h1p+h2p
    elif abs(h1p-h2p) <= 180:
        Hbp = (h1p+h2p)/2
    elif h1p+h2p < 360:
        Hbp = (h1p+h2p+360)/2
    else:
        Hbp = (h1p+h2p-360)/2

    T = (1 - 0.17*math.cos(math.radians(Hbp-30)) + 0.24*math.cos(math.radians(2*Hbp))
         + 0.32*math.cos(math.radians(3*Hbp+6)) - 0.20*math.cos(math.radians(4*Hbp-63)))
    SL = 1 + 0.015*(Lbp-50)**2/math.sqrt(20+(Lbp-50)**2)
    SC = 1 + 0.045*Cbp
    SH = 1 + 0.015*Cbp*T
    RC = 2*math.sqrt(Cbp**7/(Cbp**7+25**7))
    RT = -math.sin(math.radians(60*math.exp(-((Hbp-275)/25)**2)))*RC
    return math.sqrt((dLp/SL)**2 + (dCp/SC)**2 + (dHp/SH)**2 + RT*(dCp/SC)*(dHp/SH))


# ── CCT estimation ─────────────────────────────────────────────────────────────

def _xyz_to_cct(mean_rgb: np.ndarray) -> tuple[float, float]:
    """CCT and tint from mean linear RGB (0-1)."""
    xyz = _rgb_to_xyz(mean_rgb.reshape(1, 1, 3)).flatten()
    X, Y, Z = float(xyz[0]), float(xyz[1]), float(xyz[2])
    s = X + Y + Z + 1e-10
    x, y = X/s, Y/s

    n = (x - 0.3320) / (y - 0.1858 + 1e-10)
    cct = max(1000.0, min(20000.0, -449*n**3 + 3525*n**2 - 6823.3*n + 5520.33))

    # Tint: approximate signed distance from Planckian locus in y direction
    # Simplified: positive = too magenta, negative = too green
    y_pl = -3.000*(x**3) + 2.870*(x**2) - 0.275  # rough Planckian y at this x
    tint = round((y - y_pl) * (-1000.0), 1)  # scaled, green = negative
    return round(float(cct), 0), float(tint)


def _identify_illuminant(cct: float, tint: float) -> str:
    if 5500 < cct < 6800 and abs(tint) < 50: return "D65"
    if 4800 < cct < 5300 and abs(tint) < 40: return "D50"
    if 2700 < cct < 3300:                     return "A"
    if 3900 < cct < 4300:                     return "F11"
    if cct > 7000:                            return "D75"
    return "Unknown"


# ── Analysis functions ─────────────────────────────────────────────────────────

def _analyze_white_balance(rgb: np.ndarray, image_type: str) -> WhiteBalanceResult:
    mean = rgb.reshape(-1, 3).mean(axis=0)
    mr, mg, mb = float(mean[0]), float(mean[1]), float(mean[2])

    r_gain = round(mg / max(mr, 1e-6), 4)
    b_gain = round(mg / max(mb, 1e-6), 4)

    # WB score: how neutral is the image (100 = R=G=B)
    channels = np.array([mr, mg, mb])
    cv = float(channels.std() / (channels.mean() + 1e-6))  # coefficient of variation
    wb_score = round(max(0.0, 100.0 - cv * 200.0), 1)

    cct, tint = _xyz_to_cct(mean)

    if wb_score > 85:
        status = "balanced"
    elif tint < -30:
        status = "tinted_green"
    elif tint > 30:
        status = "tinted_magenta"
    elif cct < 4500:
        status = "warm"
    elif cct > 7000:
        status = "cool"
    else:
        status = "acceptable"

    return WhiteBalanceResult(
        r_gain=r_gain, g_gain=1.0, b_gain=b_gain,
        mean_r=round(mr * 255, 2), mean_g=round(mg * 255, 2), mean_b=round(mb * 255, 2),
        color_temperature_k=cct, tint=tint,
        wb_score=wb_score, status=status,
    )


def _analyze_gray_balance(rgb: np.ndarray) -> GrayBalanceResult:
    mean = rgb.reshape(-1, 3).mean(axis=0)
    mr, mg, mb = float(mean[0]), float(mean[1]), float(mean[2])
    overall = (mr + mg + mb) / 3.0

    r_dev = round((mr - overall) / max(overall, 1e-6) * 100.0, 3)
    g_dev = round((mg - overall) / max(overall, 1e-6) * 100.0, 3)
    b_dev = round((mb - overall) / max(overall, 1e-6) * 100.0, 3)
    err   = round(max(abs(r_dev), abs(g_dev), abs(b_dev)), 3)

    # Gray line slope: linear fit slope of (G vs R+B average)
    flat = rgb.reshape(-1, 3)
    rb_avg = (flat[:, 0] + flat[:, 2]) / 2.0
    g_chan = flat[:, 1]
    cov  = float(np.cov(rb_avg, g_chan)[0, 1])
    var  = float(np.var(rb_avg)) + 1e-10
    slope = round(cov / var, 4)

    status = ("neutral" if err < 2 else "slight" if err < 5 else "moderate" if err < 10 else "severe")
    return GrayBalanceResult(
        neutrality_error_pct=err,
        r_deviation_pct=r_dev, g_deviation_pct=g_dev, b_deviation_pct=b_dev,
        gray_line_slope=slope, status=status,
    )


def _analyze_gamma(rgb: np.ndarray) -> GammaResult:
    """Estimate image gamma from luminance distribution."""
    # Compute luminance
    lum = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    lum_flat = lum.flatten()

    median_lum = float(np.median(lum_flat[lum_flat > 0.01]))
    # For a uniformly lit scene with gamma encoding:
    # median ≈ 0.5^(1/gamma) → gamma ≈ log(0.5) / log(median)
    if 0.01 < median_lum < 0.99:
        estimated_gamma = round(abs(math.log(0.5) / math.log(median_lum + 1e-10)), 3)
    else:
        estimated_gamma = 2.2

    estimated_gamma = max(0.5, min(5.0, estimated_gamma))
    recommended_gamma = 2.2

    # Response curve: 10 levels
    x_pts = [i / 9.0 for i in range(10)]
    y_pts = [round(x ** (1.0 / estimated_gamma), 4) for x in x_pts]
    ideal = [round(x ** (1.0 / recommended_gamma), 4) for x in x_pts]

    # Linearity error: RMS diff between estimated and recommended at each level
    err = math.sqrt(sum((a - b)**2 for a, b in zip(y_pts, ideal)) / len(y_pts))
    return GammaResult(
        estimated_gamma=estimated_gamma, recommended_gamma=recommended_gamma,
        response_x=x_pts, response_y=y_pts, ideal_y=ideal,
        linearity_error_pct=round(err * 100, 3),
    )


def _analyze_saturation(img_bgr: np.ndarray) -> SaturationResult:
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]

    mean_sat = round(float(s.mean()) / 255.0 * 100.0, 2)
    mean_hue = round(float(h.mean()) / 180.0 * 360.0, 2)
    mean_val = round(float(v.mean()) / 255.0 * 100.0, 2)

    # Saturation histogram (32 bins, 0-100%)
    sh, _ = np.histogram(s.flatten(), bins=32, range=(0, 255))
    sat_hist = [float(v2) for v2 in sh.tolist()]

    # Hue histogram (36 bins, 10° each), only where saturation is meaningful (>20)
    mask = s.flatten() > 20
    hv = h.flatten()[mask] / 180.0 * 360.0 if mask.any() else h.flatten() / 180.0 * 360.0
    hh, _ = np.histogram(hv, bins=36, range=(0, 360))
    hue_hist = [float(v2) for v2 in hh.tolist()]

    return SaturationResult(
        mean_saturation_pct=mean_sat, mean_hue_deg=mean_hue, mean_value_pct=mean_val,
        saturation_histogram=sat_hist, hue_histogram=hue_hist,
    )


def _analyze_uniformity(img_bgr: np.ndarray, grid_n: int = 16) -> ColorUniformityResult:
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    h, w = gray.shape
    block_h, block_w = h // grid_n, w // grid_n
    grid = np.zeros((grid_n, grid_n), dtype=np.float32)
    for r in range(grid_n):
        for c in range(grid_n):
            cell = gray[r*block_h:(r+1)*block_h, c*block_w:(c+1)*block_w]
            grid[r, c] = float(cell.mean()) if cell.size else 0.5

    mean_g = float(grid.mean())
    std_g  = float(grid.std())
    uniformity = round(max(0.0, (1.0 - std_g / max(mean_g, 1e-6)) * 100.0), 2)
    max_var = round(float((grid.max() - grid.min()) / max(mean_g, 1e-6) * 100.0), 2)

    illum_u = round(float(grid.min() / max(grid.max(), 1e-6) * 100.0), 2)
    status = ("excellent" if uniformity > 95 else "good" if uniformity > 88
              else "acceptable" if uniformity > 75 else "poor")

    heatmap = [[float(v2) for v2 in row] for row in grid.tolist()]
    return ColorUniformityResult(
        spatial_uniformity_pct=uniformity, illumination_uniformity_pct=illum_u,
        heatmap=heatmap, heatmap_rows=grid_n, heatmap_cols=grid_n,
        max_variation_pct=max_var, status=status,
    )


def _analyze_white_point(rgb: np.ndarray) -> WhitePointResult:
    mean = rgb.reshape(-1, 3).mean(axis=0)
    xyz = _rgb_to_xyz(mean.reshape(1, 1, 3)).flatten()
    X, Y, Z = float(xyz[0]), float(xyz[1]), float(xyz[2])
    s = X + Y + Z + 1e-10
    cx, cy = round(X/s, 5), round(Y/s, 5)
    cct, tint = _xyz_to_cct(mean)
    illuminant = _identify_illuminant(cct, tint)
    return WhitePointResult(
        chromaticity_x=cx, chromaticity_y=cy,
        color_temperature_k=cct, tint=tint, illuminant=illuminant,
    )


def _analyze_color_space(rgb: np.ndarray, img_bgr: np.ndarray) -> ColorSpaceResult:
    flat = rgb.reshape(-1, 3)
    bins = 64
    hr, _ = np.histogram(flat[:, 0], bins=bins, range=(0, 1))
    hg, _ = np.histogram(flat[:, 1], bins=bins, range=(0, 1))
    hb, _ = np.histogram(flat[:, 2], bins=bins, range=(0, 1))
    bvals = np.linspace(0, 255, bins).tolist()

    lab = _rgb_to_lab(rgb).reshape(-1, 3)
    xyz = _rgb_to_xyz(rgb).reshape(-1, 3)

    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV).reshape(-1, 3).astype(np.float64)
    hue  = float(hsv[:, 0].mean()) / 180.0 * 360.0
    sat  = float(hsv[:, 1].mean()) / 255.0 * 100.0
    val  = float(hsv[:, 2].mean()) / 255.0 * 100.0

    return ColorSpaceResult(
        histogram_bins=[float(v) for v in bvals],
        histogram_r=[float(v) for v in hr.tolist()],
        histogram_g=[float(v) for v in hg.tolist()],
        histogram_b=[float(v) for v in hb.tolist()],
        lab_l_mean=round(float(lab[:, 0].mean()), 3),
        lab_a_mean=round(float(lab[:, 1].mean()), 3),
        lab_b_mean=round(float(lab[:, 2].mean()), 3),
        lab_l_std=round(float(lab[:, 0].std()), 3),
        lab_a_std=round(float(lab[:, 1].std()), 3),
        lab_b_std=round(float(lab[:, 2].std()), 3),
        hsv_hue_mean=round(hue, 2),
        hsv_sat_mean=round(sat, 2),
        hsv_val_mean=round(val, 2),
        xyz_X=round(float(xyz[:, 0].mean()), 5),
        xyz_Y=round(float(xyz[:, 1].mean()), 5),
        xyz_Z=round(float(xyz[:, 2].mean()), 5),
    )


def _sample_colorchecker(img_bgr: np.ndarray) -> tuple[list[list[float]], str]:
    """Sample 24 patches from image. Returns list of [R,G,B] 0-255 and method name."""
    h, w = img_bgr.shape[:2]
    cols, rows = 6, 4
    cell_w = w / cols
    cell_h = h / rows
    margin = 0.20  # margin fraction per side

    patches: list[list[float]] = []
    for row in range(rows):
        for col in range(cols):
            cx = int((col + 0.5) * cell_w)
            cy = int((row + 0.5) * cell_h)
            mw = max(1, int(cell_w * (0.5 - margin)))
            mh = max(1, int(cell_h * (0.5 - margin)))
            x1, y1 = max(0, cx - mw), max(0, cy - mh)
            x2, y2 = min(w, cx + mw), min(h, cy + mh)
            cell = img_bgr[y1:y2, x1:x2]
            if cell.size > 0:
                m = cell.reshape(-1, 3).mean(axis=0)
                patches.append([float(m[2]), float(m[1]), float(m[0])])  # BGR→RGB
            else:
                patches.append([128.0, 128.0, 128.0])
    return patches, "grid"


def _analyze_colorchecker(img_bgr: np.ndarray) -> ColorCheckerResult:
    measured_patches, method = _sample_colorchecker(img_bgr)
    results: list[ColorPatch] = []

    for i, (meas, ref_srgb, name) in enumerate(zip(measured_patches, _CC_SRGB, _CC_NAMES)):
        meas_np  = np.array(meas) / 255.0
        ref_np   = np.array(ref_srgb, dtype=np.float64) / 255.0
        meas_lab = _rgb_to_lab(meas_np.reshape(1, 1, 3)).flatten()
        ref_lab  = _rgb_to_lab(ref_np.reshape(1, 1, 3)).flatten()

        de76   = round(_de76(meas_lab, ref_lab), 3)
        de94   = round(_de94(meas_lab, ref_lab), 3)
        de2000 = round(_de2000(meas_lab, ref_lab), 3)

        status = "pass" if de2000 < 3.0 else "warning" if de2000 < 6.0 else "fail"
        results.append(ColorPatch(
            patch_id=i+1, name=name,
            measured_rgb=[round(v, 1) for v in meas],
            reference_rgb=list(ref_srgb),
            measured_lab=[round(float(v), 3) for v in meas_lab],
            reference_lab=[round(float(v), 3) for v in ref_lab],
            delta_e_76=de76, delta_e_94=de94, delta_e_2000=de2000, status=status,
        ))

    de_vals = [p.delta_e_2000 for p in results]
    pass_c  = sum(1 for p in results if p.status == "pass")
    warn_c  = sum(1 for p in results if p.status == "warning")
    fail_c  = sum(1 for p in results if p.status == "fail")
    mean_de = float(np.mean(de_vals))
    acc_score = round(max(0.0, 100.0 - mean_de * 8.0), 1)

    return ColorCheckerResult(
        patches=results,
        mean_delta_e_76=round(float(np.mean([p.delta_e_76 for p in results])), 3),
        mean_delta_e_94=round(float(np.mean([p.delta_e_94 for p in results])), 3),
        mean_delta_e_2000=round(mean_de, 3),
        max_delta_e_2000=round(float(np.max(de_vals)), 3),
        pass_count=pass_c, warning_count=warn_c, fail_count=fail_c,
        accuracy_score=acc_score, detection_method=method,
    )


def _generate_recommendations(
    wb: WhiteBalanceResult,
    gb: GrayBalanceResult,
    gamma: GammaResult,
    uni: ColorUniformityResult,
    cc: Optional[ColorCheckerResult],
) -> list[str]:
    recs: list[str] = []

    if wb.wb_score < 70:
        recs.append(f"Poor white balance (score {wb.wb_score:.0f}) — apply gain: R×{wb.r_gain:.3f}, B×{wb.b_gain:.3f}")
    if wb.status in ("warm", "cool"):
        recs.append(f"Color temperature {wb.color_temperature_k:.0f}K ({wb.status}) — adjust WB to target 5500-6500K")
    if abs(wb.tint) > 30:
        recs.append(f"Tint deviation {wb.tint:+.1f} — adjust green channel gain")
    if gb.neutrality_error_pct > 5:
        recs.append(f"Gray imbalance {gb.neutrality_error_pct:.1f}% — perform one-push white balance on gray card")
    if abs(gamma.estimated_gamma - gamma.recommended_gamma) > 0.3:
        recs.append(f"Gamma {gamma.estimated_gamma:.2f} deviates from recommended {gamma.recommended_gamma:.1f} — adjust camera gamma setting")
    if uni.status in ("poor", "acceptable"):
        recs.append(f"Uniformity {uni.spatial_uniformity_pct:.1f}% — improve illumination evenness; use diffused light source")
    if cc:
        if cc.mean_delta_e_2000 > 5:
            recs.append(f"Mean ΔE2000 {cc.mean_delta_e_2000:.2f} — apply color correction matrix (CCM)")
        if cc.fail_count > 4:
            recs.append(f"{cc.fail_count}/24 patches fail ΔE threshold — camera color response requires LUT correction")
        if cc.accuracy_score > 85:
            recs.append(f"Color accuracy {cc.accuracy_score:.0f}/100 — color calibration is good")

    return recs or ["Color calibration looks acceptable — validate with known color targets in production conditions."]


def _build_exports(result_dict: dict) -> tuple[str, str]:
    json_str = json.dumps({
        "white_balance": {
            "r_gain": result_dict["wb"].r_gain,
            "g_gain": result_dict["wb"].g_gain,
            "b_gain": result_dict["wb"].b_gain,
            "color_temperature_k": result_dict["wb"].color_temperature_k,
            "tint": result_dict["wb"].tint,
        },
        "gray_balance": {"neutrality_error_pct": result_dict["gb"].neutrality_error_pct},
        "gamma": {"estimated": result_dict["gamma"].estimated_gamma},
        "uniformity": {"spatial_pct": result_dict["uni"].spatial_uniformity_pct},
    }, indent=2)

    buf = StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Metric", "Value", "Unit"])
    writer.writerow(["R Gain",          result_dict["wb"].r_gain,             ""])
    writer.writerow(["B Gain",          result_dict["wb"].b_gain,             ""])
    writer.writerow(["Color Temp",      result_dict["wb"].color_temperature_k, "K"])
    writer.writerow(["WB Score",        result_dict["wb"].wb_score,           "0-100"])
    writer.writerow(["Neutrality Error",result_dict["gb"].neutrality_error_pct,"%"])
    writer.writerow(["Gamma",           result_dict["gamma"].estimated_gamma, ""])
    writer.writerow(["Spatial Uniformity",result_dict["uni"].spatial_uniformity_pct,"%"])
    if result_dict.get("cc"):
        writer.writerow(["Mean ΔE2000", result_dict["cc"].mean_delta_e_2000, ""])
        writer.writerow(["Color Accuracy", result_dict["cc"].accuracy_score, "0-100"])
    csv_str = buf.getvalue()

    return json_str, csv_str


# ── Public entry point ─────────────────────────────────────────────────────────

def run_color_calibration(
    img_bgr: np.ndarray,
    image_type: str = "reference",
) -> ColorCalibrationResult:
    if img_bgr.ndim == 2:
        img_bgr = cv2.cvtColor(img_bgr, cv2.COLOR_GRAY2BGR)

    bd = 16 if img_bgr.dtype == np.uint16 else 8
    h, w = img_bgr.shape[:2]
    rgb = _to_float_rgb(img_bgr)

    wb    = _analyze_white_balance(rgb, image_type)
    gb    = _analyze_gray_balance(rgb)
    gamma = _analyze_gamma(rgb)
    sat   = _analyze_saturation(img_bgr)
    uni   = _analyze_uniformity(img_bgr)
    wp    = _analyze_white_point(rgb)
    cs    = _analyze_color_space(rgb, img_bgr)
    cc    = _analyze_colorchecker(img_bgr) if image_type == "colorchecker" else None

    recs          = _generate_recommendations(wb, gb, gamma, uni, cc)
    json_s, csv_s = _build_exports({"wb": wb, "gb": gb, "gamma": gamma, "uni": uni, "cc": cc})

    return ColorCalibrationResult(
        image_type=image_type, image_width=int(w), image_height=int(h), bit_depth=bd,
        white_balance=wb, gray_balance=gb, gamma=gamma, saturation=sat,
        uniformity=uni, white_point=wp, color_space=cs, color_checker=cc,
        recommendations=recs, export_json=json_s, export_csv=csv_s,
    )
