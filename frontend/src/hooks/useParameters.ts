import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchParameterGroups } from '@/services/api'
import type { Parameter } from '@/types'

/** Knowledge-base parameter definitions (fetched once), plus an id lookup. */
export function useParameters() {
  const query = useQuery({ queryKey: ['parameter-groups'], queryFn: fetchParameterGroups, staleTime: Infinity })
  const paramById = useMemo(() => {
    const map: Record<string, Parameter> = {}
    for (const g of query.data ?? []) for (const p of g.parameters) map[p.id] = p
    return map
  }, [query.data])
  return { ...query, groups: query.data, paramById }
}
