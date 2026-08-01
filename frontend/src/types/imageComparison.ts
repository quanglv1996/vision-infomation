export interface ImageMetrics {
  index: number
  name: string
  width: number
  height: number
  is_color: boolean
  // Sharpness
  laplacian_variance: number
  tenengrad: number
  brenner: number
  fft_sharpness: number
  edge_density: number
  sharpness_score: number
  // Brightness
  mean_brightness: number
  median_brightness: number
  std_brightness: number
  dynamic_range_pct: number
  brightness_score: number
  // Contrast
  michelson: number
  rms_contrast: number
  local_contrast: number
  contrast_score: number
  // Noise
  noise_std: number
  snr_db: number
  noise_score: number
  // Advanced
  entropy: number
  colorfulness: number | null
  // Overall
  overall_score: number
  rank: number
  // Histograms
  histogram_bins: number[]
  histogram_gray: number[]
  histogram_r: number[] | null
  histogram_g: number[] | null
  histogram_b: number[] | null
  // Heatmaps
  focus_map: number[][]
  focus_map_rows: number
  focus_map_cols: number
  noise_map: number[][]
  noise_map_rows: number
  noise_map_cols: number
}

export interface DiffResult {
  img1_idx: number
  img2_idx: number
  mse: number
  psnr: number
  ssim: number | null
  diff_map: number[][]
  diff_map_rows: number
  diff_map_cols: number
}

export interface ComparisonResult {
  n_images: number
  metrics: ImageMetrics[]
  sharpness_ranking: number[]
  brightness_ranking: number[]
  contrast_ranking: number[]
  noise_ranking: number[]
  overall_ranking: number[]
  best_idx: number
  worst_idx: number
  diff_result: DiffResult | null
  weights_used: Record<string, number>
}

export interface ComparisonWeights {
  sharpness: number
  noise: number
  contrast: number
  brightness: number
  entropy: number
}

export interface ImageItem {
  id: string
  file: File
  name: string
  previewUrl: string
}
