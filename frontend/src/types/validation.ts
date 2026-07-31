export interface GRRInput {
  values: number[][][]
  n_operators: number
  n_parts: number
  n_replicates: number
  tolerance?: number | null
}

export interface ValidationRequest {
  system_name?: string
  measurements?: number[]
  reference_value?: number | null
  usl?: number | null
  lsl?: number | null
  reference_values?: number[]
  predictions?: number[]
  ground_truth?: number[]
  scores?: number[]
  class_names?: string[]
  ocr_predicted?: string[]
  ocr_ground_truth?: string[]
  ocr_confidences?: number[]
  inference_times_ms?: number[]
  target_fps?: number | null
  stability_results?: boolean[]
  grr?: GRRInput | null
}

export interface RepeatabilityResult {
  n: number
  mean: number
  std: number
  min_val: number
  max_val: number
  range_val: number
  cp: number | null
  cpk: number | null
  cv_pct: number
  usl: number | null
  lsl: number | null
  histogram: number[]
  histogram_edges: number[]
  status: string
}

export interface AccuracyResult {
  n: number
  mae: number
  mape_pct: number
  bias: number
  rmse: number
  max_error: number
  errors: number[]
  status: string
}

export interface GRRResult {
  n_operators: number
  n_parts: number
  n_replicates: number
  ev_pct: number
  av_pct: number
  grr_pct: number
  pv_pct: number
  ndc: number
  var_repeatability: number
  var_reproducibility: number
  var_parts: number
  status: string
}

export interface AIResult {
  n_samples: number
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  confusion_matrix: number[][]
  class_names: string[]
  per_class_precision: number[]
  per_class_recall: number[]
  per_class_f1: number[]
  roc_auc: number | null
  pr_auc: number | null
  roc_fpr: number[] | null
  roc_tpr: number[] | null
  pr_precision: number[] | null
  pr_recall_pts: number[] | null
  status: string
}

export interface OCRResult {
  n_samples: number
  char_accuracy_pct: number
  word_accuracy_pct: number
  cer_pct: number
  wer_pct: number
  mean_confidence_pct: number | null
  confidence_hist: number[] | null
  status: string
}

export interface RuntimeResult {
  n_samples: number
  mean_ms: number
  std_ms: number
  min_ms: number
  max_ms: number
  p50_ms: number
  p95_ms: number
  p99_ms: number
  fps: number
  target_fps: number | null
  histogram: number[]
  histogram_edges: number[]
  status: string
}

export interface StabilityResult {
  n_runs: number
  pass_count: number
  fail_count: number
  pass_rate_pct: number
  failure_rate_pct: number
  first_failure_at: number | null
  max_consecutive_failures: number
  fail_positions: number[]
  trend: number[]
  status: string
}

export interface ComponentScore {
  score: number
  weight: number
  label: string
  available: boolean
}

export interface FinalScore {
  overall_score: number
  verdict: string
  component_scores: Record<string, ComponentScore>
  radar_labels: string[]
  radar_values: number[]
  recommendations: string[]
}

export interface ValidationResult {
  system_name: string
  repeatability: RepeatabilityResult | null
  accuracy: AccuracyResult | null
  grr: GRRResult | null
  ai: AIResult | null
  ocr: OCRResult | null
  runtime: RuntimeResult | null
  stability: StabilityResult | null
  final_score: FinalScore
  export_json: string
  export_csv: string
}
