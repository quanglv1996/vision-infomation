// TypeScript types mirroring the backend Pydantic schemas

export interface Parameter {
  id: string
  name: string
  category: string
  unit: string
  description: string
  min_value: number | null
  max_value: number | null
  typical_range: [number, number] | null
  tags: string[]
  is_derived: boolean
}

export interface ParameterGroup {
  category: string
  parameters: Parameter[]
}

export interface Formula {
  id: string
  name: string
  description: string
  inputs: string[]
  output: string
  expression: string
  category: string
  notes: string
  inverse_expressions: Record<string, string>
  priority: number
}

// ── Calculation ─────────────────────────────────────────────────────────────

export interface CalculateRequest {
  known_values: Record<string, number>
  targets: string[]
}

export interface CalculationStep {
  parameter_id: string
  value: number
  status: 'input' | 'calculated' | 'inverse'
  formula_id: string | null
  formula_name: string | null
  expression: string | null
  input_values: Record<string, number>
  unit: string | null
  parameter_name: string | null
}

export interface CalculationWarning {
  kind: string
  parameter_id: string
  message: string
  severity: 'info' | 'warn' | 'error'
}

export interface CalculationResponse {
  steps: Record<string, CalculationStep>
  all_values: Record<string, number>
  missing_for_targets: Record<string, string[]>
  warnings: CalculationWarning[]
  validation_errors: Array<{ parameter_id: string; message: string; severity: string }>
}

export interface AnalyzeRequest {
  known_values: Record<string, number>
  targets: string[]
}

export interface AnalyzeResponse {
  computable: string[]
  missing_for_targets: Record<string, string[]>
  graph_nodes: GraphNode[]
  graph_edges: GraphEdge[]
}

// ── Graph ────────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string
  data: {
    label: string
    unit: string
    category: string
    status: 'unknown' | 'input' | 'calculated' | 'target' | 'missing'
  }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label: string
  data: { formula_id: string }
}

// ── Recommendations ──────────────────────────────────────────────────────────

export interface RecommendRequest {
  required_fov_x?: number
  required_fov_y?: number
  required_accuracy?: number
  working_distance?: number
  smallest_feature?: number
  max_blur_pixels?: number
  speed?: number
}

export interface CameraOut {
  id: string
  name: string
  brand: string
  resolution_x: number
  resolution_y: number
  pixel_size: number
  sensor_width: number
  sensor_height: number
  fps: number
  bit_depth: number
  sensor_format: string
  interface: string
  notes: string
}

export interface LensOut {
  id: string
  name: string
  brand: string
  focal_length: number
  min_f_number: number
  max_f_number: number
  min_working_distance: number
  max_sensor_format: string
  image_circle: number
  distortion_max: number
  telecentric: boolean
  notes: string
}

export interface SystemRecommendation {
  camera: CameraOut
  lens: LensOut
  computed: Record<string, number>
  score: number
  reasons: string[]
  warnings: string[]
}

// ── Projects ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  description: string
  known_values: Record<string, number>
  targets: string[]
  notes: string
  created_at: string
  updated_at: string
}

export interface ProjectSummary {
  id: string
  name: string
  description: string
  parameter_count: number
  created_at: string
  updated_at: string
}

// ── UI state ──────────────────────────────────────────────────────────────────

export type ParameterStatus = 'unknown' | 'input' | 'calculated' | 'inverse' | 'target' | 'missing'

export interface ParameterState {
  id: string
  value: number | null
  status: ParameterStatus
  isTarget: boolean
  step?: CalculationStep
}
