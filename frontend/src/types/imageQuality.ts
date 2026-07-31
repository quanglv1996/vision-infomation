export interface SharpnessResult {
  laplacian_variance: number
  tenengrad: number
  brenner: number
  sobel_energy: number
  fft_sharpness: number
  sharpness_score: number
  status: 'sharp' | 'acceptable' | 'blurry'
  focus_map: number[][]
  focus_map_rows: number
  focus_map_cols: number
}

export interface BlurResult {
  blur_type: 'none' | 'slight' | 'moderate' | 'severe' | 'motion' | 'defocus' | 'gaussian'
  severity_score: number
  motion_angle: number | null
  motion_length: number | null
  blur_map: number[][]
  blur_map_rows: number
  blur_map_cols: number
}

export interface NoiseQualityResult {
  estimated_std: number
  salt_pepper_pct: number
  noise_score: number
  noise_map: number[][]
  noise_map_rows: number
  noise_map_cols: number
}

export interface ContrastResult {
  michelson: number
  rms: number
  local_mean: number
  histogram_spread: number
  contrast_score: number
  status: 'high' | 'medium' | 'low'
}

export interface DynamicRangeQuality {
  dynamic_range_stops: number
  saturated_pct: number
  shadow_clipped_pct: number
  highlight_clipped_pct: number
  effective_range_pct: number
}

export interface SNRCNRResult {
  snr_db: number
  cnr_db: number
  snr_score: number
  status: 'excellent' | 'good' | 'poor'
}

export interface ExposureResult {
  mean_brightness_pct: number
  exposure_score: number
  is_overexposed: boolean
  is_underexposed: boolean
  overexposed_pct: number
  underexposed_pct: number
  status: 'pass' | 'warning' | 'fail'
}

export interface ColorResult {
  histogram_bins: number[]
  histogram_r: number[]
  histogram_g: number[]
  histogram_b: number[]
  mean_r: number
  mean_g: number
  mean_b: number
  white_balance_score: number
  has_color_cast: boolean
  dominant_cast: 'red' | 'green' | 'blue' | null
}

export interface ImageStatistics {
  mean: number
  median: number
  std: number
  variance: number
  entropy: number
  skewness: number
  kurtosis: number
  min_val: number
  max_val: number
  percentile_5: number
  percentile_95: number
}

export interface ApplicationScores {
  ai_inspection: number
  ocr: number
  measurement: number
  object_detection: number
  defect_detection: number
  pattern_matching: number
}

export interface ImageQualityResult {
  is_color: boolean
  image_shape: number[]
  bit_depth: number
  overall_score: number
  quality_category: 'Excellent' | 'Good' | 'Acceptable' | 'Poor'
  sharpness: SharpnessResult
  blur: BlurResult
  noise: NoiseQualityResult
  contrast: ContrastResult
  dynamic_range: DynamicRangeQuality
  snr_cnr: SNRCNRResult
  exposure: ExposureResult
  color: ColorResult | null
  statistics: ImageStatistics
  application_scores: ApplicationScores
  recommendations: string[]
}
