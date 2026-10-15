import React from 'react'
import { Box, Stack, Typography } from '@mui/material'
import type { CalculationStep, Parameter } from '@/types'
import { MONO_FONT, tint } from '@/theme/theme'
import { formatNumber } from '@/utils/format'
import { PARAM_LABELS_VI } from './paramLabels'

export const labelOf = (id: string, paramById: Record<string, Parameter>): string =>
  PARAM_LABELS_VI[id] ?? paramById[id]?.name ?? id

export const prettify = (expr: string): string => expr.replace(/\*\*/g, '^').replace(/\*/g, '×').replace(/\s+/g, ' ')

/** Replace parameter ids in an expression by their values, for "cách tính". */
export function substitute(expr: string, values: Record<string, number>): string {
  let out = expr
  for (const id of Object.keys(values).sort((a, b) => b.length - a.length)) {
    out = out.replace(new RegExp(`\\b${id}\\b`, 'g'), formatNumber(values[id], 5))
  }
  return prettify(out)
}

/** One derived value: formula, formula with numbers substituted, result. */
export const StepItem: React.FC<{ step: CalculationStep; index?: number; accent: string; paramById: Record<string, Parameter> }> = ({
  step: s, index, accent, paramById,
}) => (
  <Box sx={{ pl: 1.5, borderLeft: '2px solid', borderColor: tint(accent, 0.4) }}>
    <Typography sx={{ fontSize: '0.76rem', fontWeight: 600 }}>
      {index !== undefined && `${index + 1}. `}{labelOf(s.parameter_id, paramById)}
      {s.formula_name && <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}> — {s.formula_name}</Box>}
    </Typography>
    {s.expression && (
      <>
        <Typography sx={{ fontFamily: MONO_FONT, fontSize: '0.7rem', color: '#94A3B8', wordBreak: 'break-word' }}>
          = {prettify(s.expression)}
        </Typography>
        <Typography sx={{ fontFamily: MONO_FONT, fontSize: '0.7rem', color: '#CBD5E1', wordBreak: 'break-word' }}>
          = {substitute(s.expression, s.input_values)}
        </Typography>
      </>
    )}
    <Typography sx={{ fontFamily: MONO_FONT, fontSize: '0.76rem', color: accent, fontWeight: 700 }}>
      = {formatNumber(s.value, 5)} {paramById[s.parameter_id]?.unit ?? ''}
    </Typography>
  </Box>
)

/** Ordered "cách tính từng bước" list. */
const StepList: React.FC<{ steps: CalculationStep[]; accent: string; paramById: Record<string, Parameter> }> = ({ steps, accent, paramById }) => (
  <Stack gap={1.25}>
    {steps.map((s, i) => <StepItem key={s.parameter_id} step={s} index={i} accent={accent} paramById={paramById} />)}
  </Stack>
)

export default StepList
