"""Geometric Camera Calibration service — OpenCV-based pipeline."""
from __future__ import annotations

import json
import math
from typing import Optional

import cv2
import numpy as np

from app.schemas.geometric_calibration import (
    CameraPoseResult,
    DistortionResult,
    GeometricCalibrationResult,
    IntrinsicResult,
    LensVizResult,
    PerspectiveResult,
    PixelCalibResult,
    ReprojectionQuality,
    WorkingDistanceResult,
)


# ── helpers ────────────────────────────────────────────────────────────────────

def _to_gray(img: np.ndarray) -> np.ndarray:
    if img.ndim == 3 and img.shape[2] == 4:
        return cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
    if img.ndim == 3:
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return img


def _detect_corners(
    gray: np.ndarray,
    pattern_type: str,
    board_size: tuple[int, int],
) -> tuple[bool, Optional[np.ndarray]]:
    """Detect calibration pattern corners/centers with subpixel refinement."""
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)

    if pattern_type == "chessboard":
        flags = (cv2.CALIB_CB_ADAPTIVE_THRESH
                 + cv2.CALIB_CB_NORMALIZE_IMAGE
                 + cv2.CALIB_CB_FAST_CHECK)
        ret, corners = cv2.findChessboardCorners(gray, board_size, flags)
        if ret and corners is not None:
            corners = cv2.cornerSubPix(gray, corners, (11, 11), (-1, -1), criteria)
        return ret, corners

    if pattern_type == "circles_grid":
        ret, centers = cv2.findCirclesGrid(gray, board_size, cv2.CALIB_CB_SYMMETRIC_GRID)
        return ret, centers

    if pattern_type == "asymmetric_circles":
        ret, centers = cv2.findCirclesGrid(gray, board_size, cv2.CALIB_CB_ASYMMETRIC_GRID)
        return ret, centers

    return False, None


def _rvec_to_euler(rvec: np.ndarray) -> tuple[float, float, float]:
    """Rotation vector → Euler angles (degrees, ZYX convention)."""
    R, _ = cv2.Rodrigues(rvec)
    sy = math.sqrt(R[0, 0] ** 2 + R[1, 0] ** 2)
    if sy >= 1e-6:
        roll  = math.degrees(math.atan2(R[2, 1], R[2, 2]))
        pitch = math.degrees(math.atan2(-R[2, 0], sy))
        yaw   = math.degrees(math.atan2(R[1, 0], R[0, 0]))
    else:
        roll  = math.degrees(math.atan2(-R[1, 2], R[1, 1]))
        pitch = math.degrees(math.atan2(-R[2, 0], sy))
        yaw   = 0.0
    return roll, pitch, yaw


def _reprojection_errors(
    objpoints: list,
    imgpoints: list,
    rvecs: list,
    tvecs: list,
    K: np.ndarray,
    D: np.ndarray,
) -> tuple[float, float, list[float]]:
    per_image: list[float] = []
    all_err: list[float] = []
    for obj, img, rv, tv in zip(objpoints, imgpoints, rvecs, tvecs):
        proj, _ = cv2.projectPoints(obj, rv, tv, K, D)
        img2 = img.reshape(-1, 2).astype(np.float64)
        prj2 = proj.reshape(-1, 2).astype(np.float64)
        dists = np.linalg.norm(img2 - prj2, axis=1)
        per_image.append(round(float(dists.mean()), 4))
        all_err.extend(dists.tolist())
    mean_e = float(np.mean(all_err))
    max_e  = float(np.max(all_err))
    return mean_e, max_e, per_image


def _build_distortion_map(
    K: np.ndarray,
    D: np.ndarray,
    image_size: tuple[int, int],
    grid_n: int = 32,
) -> tuple[list[list[float]], int, int, float]:
    """Compute per-grid-cell undistortion displacement, return as 2-D heatmap."""
    w, h = image_size
    xs = np.linspace(0, w, grid_n, dtype=np.float32)
    ys = np.linspace(0, h, grid_n, dtype=np.float32)
    gx, gy = np.meshgrid(xs, ys)
    pts = np.stack([gx.flatten(), gy.flatten()], axis=1).reshape(-1, 1, 2)

    corrected = cv2.undistortPoints(pts, K, D, P=K).reshape(-1, 2)
    original  = pts.reshape(-1, 2)
    disp      = np.linalg.norm(corrected - original, axis=1).astype(np.float32)
    max_disp  = float(disp.max()) if disp.max() > 0 else 1.0

    heatmap = disp.reshape(grid_n, grid_n)
    data    = [[float(v) for v in row] for row in heatmap.tolist()]
    return data, grid_n, grid_n, max_disp


def _build_lens_viz(
    K: np.ndarray,
    D: np.ndarray,
    image_size: tuple[int, int],
    grid_n: int = 16,
) -> LensVizResult:
    """Generate ideal vs distorted grid for lens visualization."""
    w, h = image_size
    fx, fy = float(K[0, 0]), float(K[1, 1])
    cx, cy = float(K[0, 2]), float(K[1, 2])

    xs = np.linspace(w * 0.02, w * 0.98, grid_n, dtype=np.float64)
    ys = np.linspace(h * 0.02, h * 0.98, grid_n, dtype=np.float64)
    gx, gy = np.meshgrid(xs, ys)
    ideal_x = gx.flatten()
    ideal_y = gy.flatten()

    # Apply forward distortion model: ideal pixel → distorted pixel
    nx = (ideal_x - cx) / fx
    ny = (ideal_y - cy) / fy
    d = D.flatten()
    k1, k2 = float(d[0]), float(d[1])
    p1, p2 = float(d[2]), float(d[3])
    k3 = float(d[4]) if len(d) > 4 else 0.0

    r2 = nx ** 2 + ny ** 2
    radial = 1.0 + k1 * r2 + k2 * r2 ** 2 + k3 * r2 ** 3
    xd = nx * radial + 2 * p1 * nx * ny + p2 * (r2 + 2 * nx ** 2)
    yd = ny * radial + p1 * (r2 + 2 * ny ** 2) + 2 * p2 * nx * ny

    dist_x = xd * fx + cx
    dist_y = yd * fy + cy
    displacements = np.sqrt((dist_x - ideal_x) ** 2 + (dist_y - ideal_y) ** 2)

    return LensVizResult(
        grid_x_ideal=[float(v) for v in ideal_x.tolist()],
        grid_y_ideal=[float(v) for v in ideal_y.tolist()],
        grid_x_dist=[float(v) for v in dist_x.tolist()],
        grid_y_dist=[float(v) for v in dist_y.tolist()],
        displacements=[float(v) for v in displacements.tolist()],
        grid_n=grid_n,
        image_width=int(w),
        image_height=int(h),
    )


def _compute_pixel_calib(
    K: np.ndarray,
    image_size: tuple[int, int],
    square_size_mm: float,
    imgpoints: list,
) -> PixelCalibResult:
    w, h = image_size
    pixel_dists: list[float] = []
    for corners in imgpoints:
        c = corners.reshape(-1, 2)
        for i in range(min(4, len(c) - 1)):
            pixel_dists.append(float(np.linalg.norm(c[i + 1] - c[i])))
    avg_px = float(np.median(pixel_dists)) if pixel_dists else max(float(K[0, 0]), 1.0)
    mm_per_px = square_size_mm / max(avg_px, 1e-6)
    px_per_mm = 1.0 / max(mm_per_px, 1e-6)
    fov_w = w * mm_per_px
    fov_h = h * mm_per_px
    accuracy_pct = round(0.1 * mm_per_px / square_size_mm * 100, 4)
    return PixelCalibResult(
        mm_per_pixel=round(mm_per_px, 6),
        pixel_per_mm=round(px_per_mm, 4),
        fov_width_mm=round(fov_w, 2),
        fov_height_mm=round(fov_h, 2),
        measurement_accuracy_pct=round(accuracy_pct, 4),
    )


def _compute_working_distance(
    K: np.ndarray,
    tvecs: list,
    image_size: tuple[int, int],
) -> WorkingDistanceResult:
    w, h = image_size
    fx, fy = float(K[0, 0]), float(K[1, 1])
    avg_tz = float(np.mean([abs(float(t.flatten()[2])) for t in tvecs]))
    fov_w_deg = 2.0 * math.degrees(math.atan(w / (2.0 * fx)))
    fov_h_deg = 2.0 * math.degrees(math.atan(h / (2.0 * fy)))
    fov_w_mm  = 2.0 * avg_tz * math.tan(math.radians(fov_w_deg / 2.0))
    fov_h_mm  = 2.0 * avg_tz * math.tan(math.radians(fov_h_deg / 2.0))
    scale_err = abs(fx - fy) / max(fx, fy) * 100.0
    return WorkingDistanceResult(
        estimated_wd_mm=round(avg_tz, 2),
        fov_width_mm=round(fov_w_mm, 2),
        fov_height_mm=round(fov_h_mm, 2),
        scale_error_pct=round(scale_err, 4),
    )


def _compute_perspective(
    objpoints: list,
    imgpoints: list,
) -> PerspectiveResult:
    obj2d = objpoints[0][:, :2].astype(np.float32)
    img2d = imgpoints[0].reshape(-1, 2).astype(np.float32)
    H, _ = cv2.findHomography(obj2d, img2d)
    H = H.astype(float)
    sx   = float(np.linalg.norm(H[:, 0]))
    sy   = float(np.linalg.norm(H[:, 1]))
    rot  = float(math.degrees(math.atan2(H[1, 0] / max(sx, 1e-9), H[0, 0] / max(sx, 1e-9))))
    return PerspectiveResult(
        homography_matrix=[[float(v) for v in row] for row in H.tolist()],
        scale_x=round(sx, 4),
        scale_y=round(sy, 4),
        rotation_deg=round(rot, 3),
    )


def _calib_score(rms: float) -> tuple[float, str]:
    if rms < 0.3:  return 98.0, "excellent"
    if rms < 0.6:  return round(90.0 - (rms - 0.3) * 30.0, 1), "good"
    if rms < 1.0:  return round(70.0 - (rms - 0.6) * 50.0, 1), "acceptable"
    if rms < 2.0:  return round(50.0 - (rms - 1.0) * 30.0, 1), "poor"
    return max(0.0, round(20.0 - rms * 5.0, 1)), "poor"


def _recommendations(
    quality: ReprojectionQuality,
    intrinsic: IntrinsicResult,
    distortion: DistortionResult,
    n_used: int,
) -> list[str]:
    recs: list[str] = []
    if quality.rms_error > 1.0:
        recs.append(f"High reprojection error ({quality.rms_error:.2f} px) — re-shoot with sharper, evenly-lit images")
    if quality.rms_error > 0.5:
        recs.append("Cover all image corners with calibration patterns for better coverage")
        recs.append("Ensure calibration board is perfectly flat (acrylic or glass-mounted)")
    if n_used < 15:
        recs.append(f"Only {n_used} valid images — use 20–30 images at varied angles for reliable calibration")
    if abs(distortion.k1) > 0.5:
        recs.append(f"Strong radial distortion (k1={distortion.k1:.3f}) — apply undistortion to all images before measurement")
    if abs(distortion.k1) > 0.2:
        recs.append("Consider using a lens with lower distortion or recalibrate with a finer grid")
    if abs(intrinsic.fx - intrinsic.fy) / max(intrinsic.fx, 1.0) > 0.01:
        recs.append(f"Aspect ratio deviation detected (fx={intrinsic.fx:.1f}, fy={intrinsic.fy:.1f}) — check pixel aspect ratio setting")
    if distortion.max_distortion_px > 10.0:
        recs.append(f"Max distortion {distortion.max_distortion_px:.1f} px — always undistort images before measurement tasks")
    if quality.status == "excellent":
        recs.append("Excellent calibration — sub-pixel measurement applications supported")
    return recs or ["Calibration complete. Validate with known reference before production deployment."]


def _build_exports(
    K: np.ndarray,
    D: np.ndarray,
    rms: float,
    image_size: tuple[int, int],
) -> tuple[str, str, str]:
    mat = [[float(v) for v in row] for row in K.tolist()]
    dist = [float(v) for v in D.flatten().tolist()]
    w, h = image_size

    data_dict = {
        "camera_matrix":              {"rows": 3, "cols": 3, "data": mat},
        "distortion_coefficients":    {"rows": 1, "cols": len(dist), "data": dist},
        "rms_reprojection_error":     round(rms, 6),
        "image_width":  w,
        "image_height": h,
    }
    json_str = json.dumps(data_dict, indent=2)

    flat_K = [f"{v:.10g}" for row in mat for v in row]
    flat_D = [f"{v:.10g}" for v in dist]
    yaml_str = "\n".join([
        "%YAML:1.0", "---",
        f"image_width: {w}", f"image_height: {h}",
        f"rms_reprojection_error: {rms:.6f}",
        "camera_matrix: !!opencv-matrix",
        "  rows: 3", "  cols: 3", "  dt: d",
        f"  data: [ {', '.join(flat_K)} ]",
        "distortion_coefficients: !!opencv-matrix",
        f"  rows: 1", f"  cols: {len(dist)}", "  dt: d",
        f"  data: [ {', '.join(flat_D)} ]",
    ])

    flat_K_x = " ".join(flat_K)
    flat_D_x = " ".join(flat_D)
    xml_str = "\n".join([
        '<?xml version="1.0"?>',
        '<opencv_storage>',
        f'  <image_width>{w}</image_width>',
        f'  <image_height>{h}</image_height>',
        f'  <rms_error>{rms:.6f}</rms_error>',
        '  <camera_matrix type_id="opencv-matrix">',
        '    <rows>3</rows><cols>3</cols><dt>d</dt>',
        f'    <data>{flat_K_x}</data>',
        '  </camera_matrix>',
        '  <distortion_coefficients type_id="opencv-matrix">',
        f'    <rows>1</rows><cols>{len(dist)}</cols><dt>d</dt>',
        f'    <data>{flat_D_x}</data>',
        '  </distortion_coefficients>',
        '</opencv_storage>',
    ])
    return yaml_str, json_str, xml_str


# ── public entry point ─────────────────────────────────────────────────────────

def run_geometric_calibration(
    images: list[np.ndarray],
    pattern_type: str = "chessboard",
    board_cols: int = 9,
    board_rows: int = 6,
    square_size_mm: float = 25.0,
    sensor_width_mm: Optional[float] = None,
    working_distance_mm: Optional[float] = None,
) -> GeometricCalibrationResult:

    board_size = (board_cols, board_rows)
    n_corners  = board_cols * board_rows

    # Build object-space grid
    objp = np.zeros((n_corners, 3), np.float32)
    if pattern_type == "asymmetric_circles":
        idx = 0
        for r in range(board_rows):
            for c in range(board_cols):
                objp[idx] = [(2 * c + r % 2) * square_size_mm, r * square_size_mm, 0.0]
                idx += 1
    else:
        objp[:, :2] = np.mgrid[0:board_cols, 0:board_rows].T.reshape(-1, 2) * square_size_mm

    objpoints: list[np.ndarray] = []
    imgpoints: list[np.ndarray] = []
    valid_idx: list[int]        = []
    img_size: Optional[tuple[int, int]] = None

    for i, img in enumerate(images):
        gray = _to_gray(img)
        if img_size is None:
            img_size = (int(gray.shape[1]), int(gray.shape[0]))
        ret, corners = _detect_corners(gray, pattern_type, board_size)
        if ret and corners is not None:
            objpoints.append(objp.copy())
            imgpoints.append(corners)
            valid_idx.append(i)

    if len(objpoints) < 3:
        raise ValueError(
            f"Pattern detected in only {len(objpoints)}/{len(images)} image(s). "
            "Need ≥ 3 valid detections. "
            "Verify board_cols × board_rows settings and image quality."
        )

    # ── camera calibration ──────────────────────────────────────────────────
    rms, cam_mat, dist_raw, rvecs, tvecs = cv2.calibrateCamera(
        objpoints, imgpoints, img_size, None, None  # type: ignore[arg-type]
    )
    rms = float(rms)
    K   = cam_mat.astype(np.float64)
    D   = dist_raw.astype(np.float64)

    fx, fy = float(K[0, 0]), float(K[1, 1])
    cx, cy = float(K[0, 2]), float(K[1, 2])

    intrinsic = IntrinsicResult(
        fx=round(fx, 4),
        fy=round(fy, 4),
        cx=round(cx, 4),
        cy=round(cy, 4),
        aspect_ratio=round(fy / max(fx, 1e-9), 6),
        camera_matrix=[[float(v) for v in row] for row in K.tolist()],
    )

    # ── distortion ─────────────────────────────────────────────────────────
    d_flat = D.flatten()
    k1, k2 = float(d_flat[0]), float(d_flat[1])
    p1, p2 = float(d_flat[2]), float(d_flat[3])
    k3     = float(d_flat[4]) if len(d_flat) > 4 else 0.0

    dist_map, dm_r, dm_c, max_disp = _build_distortion_map(K, D, img_size)  # type: ignore[arg-type]
    distortion = DistortionResult(
        k1=round(k1, 6), k2=round(k2, 6), k3=round(k3, 6),
        p1=round(p1, 6), p2=round(p2, 6),
        distortion_vector=[round(float(v), 6) for v in d_flat.tolist()],
        max_distortion_px=round(max_disp, 3),
        distortion_map=dist_map,
        distortion_map_rows=dm_r,
        distortion_map_cols=dm_c,
    )

    # ── reprojection quality ────────────────────────────────────────────────
    mean_e, max_e, per_img = _reprojection_errors(objpoints, imgpoints, rvecs, tvecs, K, D)
    score, status = _calib_score(rms)
    quality = ReprojectionQuality(
        rms_error=round(rms, 4),
        mean_error=round(mean_e, 4),
        max_error=round(max_e, 4),
        per_image_errors=per_img,
        calibration_score=round(score, 1),
        status=status,
    )

    # ── per-image poses ─────────────────────────────────────────────────────
    poses: list[CameraPoseResult] = []
    for i, (rv, tv) in enumerate(zip(rvecs, tvecs)):
        roll, pitch, yaw = _rvec_to_euler(rv)
        t = tv.flatten()
        proj, _ = cv2.projectPoints(objpoints[i], rv, tv, K, D)
        img2  = imgpoints[i].reshape(-1, 2).astype(np.float64)
        prj2  = proj.reshape(-1, 2).astype(np.float64)
        err_i = float(np.linalg.norm(img2 - prj2, axis=1).mean())
        poses.append(CameraPoseResult(
            image_index=valid_idx[i],
            roll_deg=round(roll, 3),
            pitch_deg=round(pitch, 3),
            yaw_deg=round(yaw, 3),
            tx_mm=round(float(t[0]), 3),
            ty_mm=round(float(t[1]), 3),
            tz_mm=round(float(t[2]), 3),
            reprojection_error=round(err_i, 4),
        ))

    # ── lens visualization ──────────────────────────────────────────────────
    lens_viz = _build_lens_viz(K, D, img_size)  # type: ignore[arg-type]

    # ── perspective / homography ────────────────────────────────────────────
    perspective = _compute_perspective(objpoints, imgpoints)

    # ── pixel calibration ───────────────────────────────────────────────────
    pixel_calib = _compute_pixel_calib(K, img_size, square_size_mm, imgpoints)  # type: ignore[arg-type]

    # ── working distance ────────────────────────────────────────────────────
    wd = _compute_working_distance(K, tvecs, img_size)  # type: ignore[arg-type]

    # ── recommendations & exports ───────────────────────────────────────────
    recs              = _recommendations(quality, intrinsic, distortion, len(objpoints))
    yaml_s, json_s, xml_s = _build_exports(K, D, rms, img_size)  # type: ignore[arg-type]

    return GeometricCalibrationResult(
        pattern_type=pattern_type,
        board_cols=board_cols,
        board_rows=board_rows,
        square_size_mm=square_size_mm,
        num_images_total=len(images),
        num_images_used=len(objpoints),
        image_width=int(img_size[0]),
        image_height=int(img_size[1]),
        intrinsic=intrinsic,
        distortion=distortion,
        perspective=perspective,
        pixel_calib=pixel_calib,
        working_distance=wd,
        poses=poses,
        lens_viz=lens_viz,
        quality=quality,
        recommendations=recs,
        export_yaml=yaml_s,
        export_json=json_s,
        export_opencv_xml=xml_s,
    )
