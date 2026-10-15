import { create } from 'zustand'

/**
 * App-level navigation: which module is shown, plus deep links into the
 * Docs module (article id) and the Calculator's guided scenarios.
 */
interface NavStore {
  moduleId: string
  docId: string | null
  scenarioId: string | null
  setModule: (id: string) => void
  openDoc: (docId: string) => void
  openScenario: (scenarioId: string) => void
  /** Called by the Calculator once it has switched to the requested scenario. */
  consumeScenario: () => void
}

export const useNavStore = create<NavStore>()(set => ({
  moduleId: 'calculator',
  docId: null,
  scenarioId: null,
  setModule: id => set({ moduleId: id }),
  openDoc: docId => set({ moduleId: 'docs', docId }),
  openScenario: scenarioId => set({ moduleId: 'calculator', scenarioId }),
  consumeScenario: () => set({ scenarioId: null }),
}))
