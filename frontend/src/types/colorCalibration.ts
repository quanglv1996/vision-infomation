export interface WhiteBalanceResult {
  r_gain: number
  g_gain: number
  b_gain: number
  mean_r: number
  mean_g: number
  mean_b: number
  color_temperature_k: number
  tint: number
  wb_score: number
  status: string
}

export interface GrayBalanceResult {
  neutrality_error_pct: number
  r_deviation_pct: number
  g_deviation_pct: number
  b_deviation_pct: number
  gray_line_slope: number
  status: string
}

export interface ColorPatch {
  patch_id: number
  name: string
  measured_rgb: number[]
  reference_rgb: number[]
  measured_lab: number[]
  reference_lab: number[]
  delta_e_76: number
  delta_e_94: number
  delta_e_2000: number
  status: string
}

export interface ColorCheckerResult {
  patches: ColorPatch[]
  mean_delta_e_76: number
  mean_delta_e_94: number
  mean_delta_e_2000: number
  max_delta_e_2000: number
  pass_count: number
  warning_count: number
  fail_count: number
  accuracy_score: number
  detection_method: string
}

export interface GammaResult {
  estimated_gamma: number
  recommended_gamma: number
  response_x: number[]
  response_y: number[]
  ideal_y: number[]
  linearity_error_pct: number
}

export interface SaturationResult {
  mean_saturation_pct: number
  mean_hue_deg: number
  mean_value_pct: number
  saturation_histogram: number[]
  hue_histogram: number[]
}

export interface ColorUniformityResult {
  spatial_uniformity_pct: number
  illumination_uniformity_pct: number
  heatmap: number[][]
  heatmap_rows: number
  heatmap_cols: number
  max_variation_pct: number
  status: string
}

export interface WhitePointResult {
  chromaticity_x: number
  chromaticity_y: number
  color_temperature_k: number
  tint: number
  illuminant: string
}

export interface ColorSpaceResult {
  histogram_bins: number[]
  histogram_r: number[]
  histogram_g: number[]
  histogram_b: number[]
  lab_l_mean: number
  lab_a_mean: number
  lab_b_mean: number
  lab_l_std: number
  lab_a_std: number
  lab_b_std: number
  hsv_hue_mean: number
  hsv_sat_mean: number
  hsv_val_mean: number
  xyz_X: number
  xyz_Y: number
  xyz_Z: number
}

export interface ColorCalibrationResult {
  image_type: string
  image_width: number
  image_height: number
  bit_depth: number
  white_balance: WhiteBalanceResult
  gray_balance: GrayBalanceResult
  gamma: GammaResult
  saturation: SaturationResult
  uniformity: ColorUniformityResult
  white_point: WhitePointResult
  color_space: ColorSpaceResult
  color_checker: ColorCheckerResult | null
  recommendations: string[]
  export_json: string
  export_csv: string
}
