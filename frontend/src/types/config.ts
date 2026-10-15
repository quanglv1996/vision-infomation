// Mirrors backend/app/schemas/config.py

export interface SavedConfig {
  id: number
  name: string
  description: string
  /** Guided scenario id; null for the free-form calculator. */
  scenario_id: string | null
  mode: string | null
  values: Record<string, number>
  targets: string[]
  /** Every value the engine derived from `values` when it was saved. */
  results: Record<string, number>
  created_at: string
  updated_at: string
}

export interface ConfigInput {
  name: string
  description: string
  scenario_id: string | null
  mode: string | null
  values: Record<string, number>
  targets: string[]
}

export type ConfigUpdate = Partial<ConfigInput>
