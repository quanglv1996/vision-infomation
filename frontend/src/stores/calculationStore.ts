import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  CalculationResponse,
  CalculationWarning,
  ParameterGroup,
  ParameterState,
  ParameterStatus,
} from '@/types'
import { runCalculation } from '@/services/api'

interface LogEntry {
  id: string
  timestamp: Date
  message: string
  level: 'info' | 'warn' | 'error'
}

interface CalcStore {
  // metadata loaded from API
  parameterGroups: ParameterGroup[]
  setParameterGroups: (groups: ParameterGroup[]) => void

  // live parameter states keyed by id
  params: Record<string, ParameterState>

  // user-facing state
  selectedParamId: string | null
  isCalculating: boolean
  lastResult: CalculationResponse | null
  log: LogEntry[]
  activeTab: 'parameters' | 'graph' | 'recommendations'

  // actions
  setParamValue: (id: string, value: number | null) => void
  toggleTarget: (id: string) => void
  selectParam: (id: string | null) => void
  setActiveTab: (tab: CalcStore['activeTab']) => void
  calculate: () => Promise<void>
  clearAll: () => void
  loadFromResult: (result: CalculationResponse) => void
}

const _logId = () => Math.random().toString(36).slice(2)

export const useCalcStore = create<CalcStore>()(
  immer((set, get) => ({
    parameterGroups: [],
    params: {},
    selectedParamId: null,
    isCalculating: false,
    lastResult: null,
    log: [],
    activeTab: 'parameters',

    setParameterGroups(groups) {
      set(state => {
        state.parameterGroups = groups
        // Initialise param states for any new parameters
        for (const group of groups) {
          for (const p of group.parameters) {
            if (!state.params[p.id]) {
              state.params[p.id] = {
                id: p.id,
                value: null,
                status: 'unknown',
                isTarget: false,
              }
            }
          }
        }
      })
    },

    setParamValue(id, value) {
      set(state => {
        const param = state.params[id]
        if (!param) {
          state.params[id] = { id, value, status: value !== null ? 'input' : 'unknown', isTarget: false }
        } else {
          param.value = value
          param.status = value !== null ? 'input' : 'unknown'
        }
      })
    },

    toggleTarget(id) {
      set(state => {
        const param = state.params[id]
        if (param) {
          param.isTarget = !param.isTarget
          if (param.isTarget && param.status === 'unknown') {
            param.status = 'target'
          } else if (!param.isTarget && param.status === 'target') {
            param.status = 'unknown'
          }
        }
      })
    },

    selectParam(id) {
      set(state => { state.selectedParamId = id })
    },

    setActiveTab(tab) {
      set(state => { state.activeTab = tab })
    },

    async calculate() {
      const state = get()
      const knownValues: Record<string, number> = {}
      const targets: string[] = []

      for (const [id, p] of Object.entries(state.params)) {
        if (p.value !== null && p.status === 'input') {
          knownValues[id] = p.value
        }
        if (p.isTarget) {
          targets.push(id)
        }
      }

      set(s => { s.isCalculating = true })

      try {
        const result = await runCalculation({ known_values: knownValues, targets })
        get().loadFromResult(result)

        const calcCount = Object.values(result.steps).filter(s => s.status !== 'input').length
        set(s => {
          s.log.unshift({
            id: _logId(),
            timestamp: new Date(),
            message: `Calculated ${calcCount} parameters from ${Object.keys(knownValues).length} inputs`,
            level: 'info',
          })
          for (const w of result.warnings) {
            s.log.unshift({
              id: _logId(),
              timestamp: new Date(),
              message: `[${w.kind.toUpperCase()}] ${w.message}`,
              level: w.severity === 'error' ? 'error' : 'warn',
            })
          }
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        set(s => {
          s.log.unshift({
            id: _logId(),
            timestamp: new Date(),
            message: `Calculation failed: ${msg}`,
            level: 'error',
          })
        })
      } finally {
        set(s => { s.isCalculating = false })
      }
    },

    loadFromResult(result) {
      set(state => {
        state.lastResult = result
        // Update param states from result
        for (const [id, step] of Object.entries(result.steps)) {
          const existing = state.params[id]
          if (existing) {
            existing.value = step.value
            existing.status = step.status as ParameterStatus
            existing.step = step
          } else {
            state.params[id] = {
              id,
              value: step.value,
              status: step.status as ParameterStatus,
              isTarget: false,
              step,
            }
          }
        }
        // Mark missing as 'missing'
        for (const missingList of Object.values(result.missing_for_targets)) {
          for (const pid of missingList) {
            const p = state.params[pid]
            if (p && p.status === 'unknown') {
              p.status = 'missing'
            }
          }
        }
      })
    },

    clearAll() {
      set(state => {
        for (const p of Object.values(state.params)) {
          p.value = null
          p.status = p.isTarget ? 'target' : 'unknown'
          p.step = undefined
        }
        state.lastResult = null
        state.log.unshift({
          id: _logId(),
          timestamp: new Date(),
          message: 'Workspace cleared',
          level: 'info',
        })
      })
    },
  }))
)
