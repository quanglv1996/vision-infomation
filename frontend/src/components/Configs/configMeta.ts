import type { SvgIconComponent } from '@mui/icons-material'
import { Tune as FreeIcon } from '@mui/icons-material'
import { SCENARIOS } from '@/components/Scenarios/scenarios'
import { ACCENT } from '@/theme/theme'
import type { SavedConfig } from '@/types/config'

export interface ConfigMeta {
  title: string
  accent: string
  Icon: SvgIconComponent
  modeLabel: string | null
  /** Result ids worth showing on the config card, most important first. */
  outputs: string[]
}

export const FREE_TITLE = 'Nâng cao (tự do)'

const FREE_OUTPUTS = ['fov_x', 'mm_per_pixel', 'focal_length', 'working_distance', 'dof', 'magnification', 'blur_pixels', 'line_rate']

/** Display info for a saved config: its scenario's look, or the free-form calculator's. */
export function configMeta(cfg: Pick<SavedConfig, 'scenario_id' | 'mode'>): ConfigMeta {
  const sc = cfg.scenario_id ? SCENARIOS.find(s => s.id === cfg.scenario_id) : undefined
  if (!sc) return { title: FREE_TITLE, accent: ACCENT.indigo, Icon: FreeIcon, modeLabel: null, outputs: FREE_OUTPUTS }
  return {
    title: sc.title,
    accent: sc.accent,
    Icon: sc.Icon,
    modeLabel: sc.modes.find(m => m.id === cfg.mode)?.label ?? null,
    outputs: sc.outputs,
  }
}

/** Up to *n* computed (not entered) values to summarise a config. */
export function keyResults(cfg: SavedConfig, n = 4): string[] {
  return configMeta(cfg).outputs.filter(id => !(id in cfg.values) && typeof cfg.results[id] === 'number').slice(0, n)
}
