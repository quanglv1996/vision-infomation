import { create } from 'zustand'

/**
 * Inputs of the free-form ("Nâng cao") calculator. Kept in a store so the
 * guided view and saved configs can hand values over to it.
 */
interface FreeFormStore {
  values: Record<string, number>
  targets: string[]
  setValue: (id: string, value: number | null) => void
  toggleTarget: (id: string) => void
  load: (values: Record<string, number>, targets?: string[]) => void
  clear: () => void
}

export const useFreeFormStore = create<FreeFormStore>()(set => ({
  values: {},
  targets: [],
  setValue: (id, value) => set(s => {
    const values = { ...s.values }
    if (value === null) delete values[id]
    else values[id] = value
    return { values }
  }),
  toggleTarget: id => set(s => ({
    targets: s.targets.includes(id) ? s.targets.filter(t => t !== id) : [...s.targets, id],
  })),
  load: (values, targets = []) => set({ values: { ...values }, targets: [...targets] }),
  clear: () => set({ values: {}, targets: [] }),
}))
