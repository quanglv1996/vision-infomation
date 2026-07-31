// TypeScript types mirroring backend Lighting schemas

export interface BrightnessStats {
  mean: number
  median: number
  min_val: number
  max_val: number
  std: number
  pct_of_full_scale: number
  status: 'pass' | 'warning' | 'fail'
}

export interface HistogramResult {
  bins: number[]
  counts: number[]
  underexposed_pct: number
  overexposed_pct: number
  clipping_low: boolean
  clipping_high: boolean
  peak_bin: number
}

export interface UniformityResult {
  uniformity_min_max: number
  uniformity_cv: number
  status: 'excellent' | 'good' | 'acceptable' | 'bad'
  heatmap_data: number[][]
  heatmap_rows: number
  heatmap_cols: number
}

export interface HotspotInfo {
  x: number
  y: number
  width: number
  height: number
  severity: number
  type: 'bright' | 'shadow' | 'gradient'
}

export interface HotspotResult {
  hotspots: HotspotInfo[]
  severity_score: number
  heatmap_data: number[][]
  heatmap_rows: number
  heatmap_cols: number
}

export interface NoiseResult {
  spatial_mean: number
  spatial_std: number
  temporal_mean: number
  temporal_std: number
  noise_map: number[][]
  noise_map_rows: number
  noise_map_cols: number
}

export interface SNRResult {
  snr_linear: number
  snr_db: number
  status: 'excellent' | 'good' | 'poor'
}

export interface FlickerResult {
  brightness_over_time: number[]
  frame_indices: number[]
  mean: number
  std: number
  has_flicker: boolean
  flicker_pct: number
  frequency_estimate: number | null
  fft_frequencies: number[]
  fft_amplitudes: number[]
}

export interface DynamicRangeResult {
  effective_dr_stops: number
  usable_dr_stops: number
  signal_mean: number
  noise_floor: number
}

export interface LightingAnalysisResult {
  num_frames: number
  image_shape: number[]
  bit_depth: number
  brightness: BrightnessStats
  histogram: HistogramResult
  uniformity: UniformityResult
  hotspots: HotspotResult
  noise: NoiseResult
  snr: SNRResult
  flicker: FlickerResult | null
  dynamic_range: DynamicRangeResult | null
  recommendations: string[]
  overall_status: 'pass' | 'warning' | 'fail'
}
