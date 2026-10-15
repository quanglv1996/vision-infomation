import { create } from 'zustand'
import type { SavedConfig } from '@/types/config'
import { useNavStore } from './navStore'

/** Calculator workspace key: a guided scenario id, or FREE_KEY for the free-form view. */
export const FREE_KEY = 'free'

export const configKey = (scenarioId: string | null): string => scenarioId ?? FREE_KEY

/** The saved config a calculator workspace was loaded from / last saved to. */
export interface LinkedConfig {
  id: number
  name: string
  mode: string | null
  values: Record<string, number>
  targets: string[]
}

interface ConfigStore {
  linked: Record<string, LinkedConfig>
  /** Requested from the Configs module; the calculator consumes it. */
  pending: SavedConfig | null

  link: (cfg: SavedConfig) => void
  unlink: (key: string) => void
  /** Drop links to a config (deleted elsewhere). */
  forget: (id: number) => void
  clear: () => void
  openConfig: (cfg: SavedConfig) => void
  consume: () => void
}

export const useConfigStore = create<ConfigStore>()(set => ({
  linked: {},
  pending: null,

  link: cfg => set(s => ({
    linked: {
      ...s.linked,
      [configKey(cfg.scenario_id)]: { id: cfg.id, name: cfg.name, mode: cfg.mode, values: cfg.values, targets: cfg.targets },
    },
  })),
  unlink: key => set(s => {
    const linked = { ...s.linked }
    delete linked[key]
    return { linked }
  }),
  forget: id => set(s => ({ linked: Object.fromEntries(Object.entries(s.linked).filter(([, c]) => c.id !== id)) })),
  clear: () => set({ linked: {}, pending: null }),
  openConfig: cfg => {
    set({ pending: cfg })
    useNavStore.getState().setModule('calculator')
  },
  consume: () => set({ pending: null }),
}))

const sameNumber = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b))

/** True when the workspace inputs differ from the linked config. */
export function isDirty(linked: LinkedConfig, mode: string | null, values: Record<string, number>, targets: string[] = []): boolean {
  if ((linked.mode ?? null) !== (mode ?? null)) return true
  const a = Object.keys(linked.values)
  const b = Object.keys(values)
  if (a.length !== b.length || a.some(k => !(k in values) || !sameNumber(linked.values[k], values[k]))) return true
  return [...linked.targets].sort().join() !== [...targets].sort().join()
}
