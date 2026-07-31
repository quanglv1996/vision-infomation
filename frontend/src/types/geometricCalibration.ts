export interface IntrinsicResult {
  fx: number
  fy: number
  cx: number
  cy: number
  aspect_ratio: number
  camera_matrix: number[][]
}

export interface DistortionResult {
  k1: number
  k2: number
  k3: number
  p1: number
  p2: number
  distortion_vector: number[]
  max_distortion_px: number
  distortion_map: number[][]
  distortion_map_rows: number
  distortion_map_cols: number
}

export interface PerspectiveResult {
  homography_matrix: number[][]
  scale_x: number
  scale_y: number
  rotation_deg: number
}

export interface PixelCalibResult {
  mm_per_pixel: number
  pixel_per_mm: number
  fov_width_mm: number
  fov_height_mm: number
  measurement_accuracy_pct: number
}

export interface WorkingDistanceResult {
  estimated_wd_mm: number
  fov_width_mm: number
  fov_height_mm: number
  scale_error_pct: number
}

export interface CameraPoseResult {
  image_index: number
  roll_deg: number
  pitch_deg: number
  yaw_deg: number
  tx_mm: number
  ty_mm: number
  tz_mm: number
  reprojection_error: number
}

export interface LensVizResult {
  grid_x_ideal: number[]
  grid_y_ideal: number[]
  grid_x_dist: number[]
  grid_y_dist: number[]
  displacements: number[]
  grid_n: number
  image_width: number
  image_height: number
}

export interface ReprojectionQuality {
  rms_error: number
  mean_error: number
  max_error: number
  per_image_errors: number[]
  calibration_score: number
  status: string
}

export interface GeometricCalibrationResult {
  pattern_type: string
  board_cols: number
  board_rows: number
  square_size_mm: number
  num_images_total: number
  num_images_used: number
  image_width: number
  image_height: number
  intrinsic: IntrinsicResult
  distortion: DistortionResult
  perspective: PerspectiveResult
  pixel_calib: PixelCalibResult | null
  working_distance: WorkingDistanceResult | null
  poses: CameraPoseResult[]
  lens_viz: LensVizResult
  quality: ReprojectionQuality
  recommendations: string[]
  export_yaml: string
  export_json: string
  export_opencv_xml: string
}

export interface CalibrationParams {
  patternType: string
  boardCols: number
  boardRows: number
  squareSizeMm: number
  sensorWidthMm?: number | null
  workingDistanceMm?: number | null
}
