# Calculations Reference

All calculators are in `backend/app/calculations/`. Each extends `BaseCalculator` and returns a `CalculatorResult`.

---

## 1. FoVCalculator — Field of View

**Formula:**
```
FoV_H (mm) = sensor_width  × working_distance / focal_length
FoV_V (mm) = sensor_height × working_distance / focal_length
FoV_D      = √(FoV_H² + FoV_V²)
```

**Inputs:** `sensor_width` [mm], `sensor_height` [mm], `working_distance` [mm], `focal_length` [mm]  
**Outputs:** `horizontal_fov_mm`, `vertical_fov_mm`, `diagonal_fov_mm`, angular FoV [°]  
**Condition:** Thin-lens approximation; valid when `working_distance >> focal_length`  
**Refs:** Edmund Optics Imaging Resource Guide §3

---

## 2. DoFCalculator — Depth of Field

**Formula (standard photographic DoF):**
```
c = 2 × pixel_size_µm / 1000   [mm — Circle of Confusion]
Near = d·f² / (f² + N·c·(d − f))
Far  = d·f² / (f² − N·c·(d − f))
DoF  = Far − Near
Hyperfocal H = f² / (N·c) + f
```

**Inputs:** `focal_length` [mm], `aperture` [f/#], `working_distance` [mm], `pixel_size` [µm]  
**Outputs:** `total_dof_mm`, `near_focus_mm`, `far_focus_mm`, `hyperfocal_distance_mm`  
**Refs:** Basler Technical Guide – DoF in Machine Vision; Edmund Optics – DoF and Depth of Focus

---

## 3. MotionBlurCalculator

**Formula:**
```
blur_mm     = object_speed [mm/s] × exposure_time [s]
pixel_density = resolution_width / FoV_H
blur_pixels  = blur_mm × pixel_density
max_exposure_for_1px = 1 / (pixel_density × speed)   [s]
```

**Inputs:** `object_speed` [mm/s], `exposure_time` [µs], `pixel_size` [µm], `horizontal_fov` [mm], `resolution_width` [px]  
**Outputs:** `blur_mm`, `blur_pixels`, `max_exposure_for_1px_blur_us`  
**Refs:** Basler App Note – Avoiding Motion Blur; Cognex Vision Guide

---

## 4. ResolutionCalculator

**Formula:**
```
FoV_H = sensor_width × working_distance / focal_length
mm/pixel = FoV_H / resolution_width
px/mm    = resolution_width / FoV_H
µm/pixel = mm/pixel × 1000
```

**Inputs:** `sensor_width` [mm], `working_distance` [mm], `focal_length` [mm], `resolution_width` [px]  
**Outputs:** `mm_per_pixel`, `pixels_per_mm`, `um_per_pixel`  
**Refs:** Basler – Resolution and Pixel Size Basics

---

## 5. PixelDensityCalculator

Same geometry as Resolution. Also checks whether `min_defect_size` spans ≥ 2 pixels (Nyquist criterion).

---

## 6. DiffractionCalculator — Airy Disk

**Formula:**
```
Airy disk diameter (µm) = 2.44 × λ (µm) × f/#
Diffraction limit (lp/mm) = 1000 / (λ_µm × f/#)
Rayleigh criterion (lp/mm) = 1000 / (1.22 × λ_µm × f/#)
```
Default λ = 550 nm (green light).

**Inputs:** `aperture` [f/#], `pixel_size` [µm], `wavelength_um` [µm] (optional)  
**Outputs:** `airy_disk_diameter_um`, `diffraction_limit_lpmm`, `is_diffraction_limited`  
**Refs:** Edmund Optics – Airy Disk; Opto Engineering – Resolution Limit; Zemax Technical Reference

---

## 7. NyquistCalculator

**Formula:**
```
Nyquist (lp/mm) = 1 / (2 × pixel_size_mm)
min_detectable_feature = 2 × pixel_size
```

**Inputs:** `pixel_size` [µm], `required_accuracy` [mm] (optional)  
**Outputs:** `nyquist_frequency_lpmm`, `min_detectable_feature_mm`, `can_meet_accuracy`  
**Refs:** Basler – Sampling Theorem in Digital Imaging; Edmund Optics – Nyquist Sampling

---

## 8. SensorCalculator

**Formula:**
```
Dynamic Range (dB) = 20 × log10(FWC / read_noise)
DR (stops)         = DR_dB / 6.02
SNR_max (dB)       = 10 × log10(FWC)   [shot-noise limited at FWC]
total_noise        = √(read_noise² + signal)
ADC bits needed    = log2(FWC / read_noise)
```

**Inputs:** `full_well_capacity` [e-], `read_noise` [e-], `quantum_efficiency` [%], `bit_depth`  
**Outputs:** `dynamic_range_db`, `snr_max_db`, `adc_sufficient`  
**Refs:** Sony Sensor Technical Notes; EMVA1288 Standard; Princeton Instruments CCD Tech Note

---

## 9. BrightnessCalculator

**Formula:**
```
relative_brightness (%) = 100 / f²
stops_from_f1 = 2 × log2(f/#)
```

**Inputs:** `aperture` [f/#], `exposure_time` [µs], `reflectivity` [%], `ambient_light` [lux]  
**Outputs:** `relative_brightness_pct`, `stops_from_f1`  
**Refs:** Basler App Note – Illumination; Keyence Machine Vision Lighting Guide

---

## 10. LensMatchingCalculator

**Checks:**
1. `image_circle ≥ sensor_diagonal` (sensor diagonal = √(W²+H²))
2. Required focal length = `sensor_width × working_distance / object_width`
3. `mtf50 ≥ nyquist_frequency`

**Score (0–100):**
- Image circle OK: +40 pts (+5 if margin > 10%)
- MTF sufficient: +30 pts (unknown: +15)
- Focal length match < 5% error: +25 pts

**Refs:** Edmund Optics Lens Selection Guide; Opto Engineering Telecentric Lens Selection

---

## Score Interpretation

| Score | Meaning                           |
|-------|-----------------------------------|
| 80–100 | Excellent — highly suitable      |
| 60–79  | Good — meets requirements        |
| 40–59  | Marginal — review parameters     |
| < 40   | Poor — component mismatch likely |
