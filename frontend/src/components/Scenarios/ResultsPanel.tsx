import React, { useMemo } from 'react'
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, LinearProgress, Stack, Tooltip, Typography,
} from '@mui/material'
import {
  CancelRounded as FailIcon,
  CheckCircleRounded as PassIcon,
  ErrorRounded as WarnIcon,
  ExpandMore as ExpandMoreIcon,
  Functions as FormulaIcon,
  LightbulbOutlined as TipIcon,
  TaskAlt as VerdictIcon,
} from '@mui/icons-material'
import type { CalculationResponse, CalculationStep, Parameter } from '@/types'
import { TONE } from '@/theme/status'
import { MONO_FONT, tint } from '@/theme/theme'
import { formatNumber } from '@/utils/format'
import StepList, { labelOf } from './StepList'
import Recommendations from '@/components/Recommendations'
import type { CheckStatus, Scenario, Values } from './scenarios'

const STATUS_STYLE: Record<CheckStatus, { color: string; Icon: typeof PassIcon; text: string }> = {
  pass: { color: TONE.success, Icon: PassIcon, text: 'Đạt' },
  warn: { color: TONE.warning, Icon: WarnIcon, text: 'Cần chú ý' },
  fail: { color: TONE.error, Icon: FailIcon, text: 'Không đạt' },
}

interface ResultsPanelProps {
  scenario: Scenario
  mode: string
  inputs: Values
  result: CalculationResponse | null
  loading: boolean
  error: string | null
  paramById: Record<string, Parameter>
}

export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase', color: '#64748B', mb: 1 }}>
    {children}
  </Typography>
)

const ResultsPanel: React.FC<ResultsPanelProps> = ({ scenario, mode, inputs, result, loading, error, paramById }) => {
  const values: Values = result?.all_values ?? {}

  const checks = useMemo(
    () => scenario.checks
      .map(c => ({ label: c.label, res: c.evaluate(values) }))
      .filter((c): c is { label: string; res: NonNullable<typeof c.res> } => c.res !== null),
    [scenario, values],
  )
  const suggestions = useMemo(() => scenario.suggest?.(values, mode) ?? [], [scenario, values, mode])

  const counts = { pass: 0, warn: 0, fail: 0 }
  for (const c of checks) counts[c.res.status]++
  const verdict: CheckStatus = counts.fail ? 'fail' : counts.warn ? 'warn' : 'pass'
  const verdictText = {
    pass: 'Cấu hình đạt yêu cầu',
    warn: 'Đạt nhưng cần chú ý',
    fail: 'Chưa đạt — điều chỉnh thông số',
  }[verdict]

  const tiles = scenario.outputs.filter(id => !(id in inputs) && typeof values[id] === 'number')
  const steps: CalculationStep[] = result
    ? Object.values(result.steps).filter(s => s.status !== 'input')
    : []
  const engineWarnings = (result?.warnings ?? []).filter(w => w.kind !== 'performance')

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1, height: 2 }}>
        {loading && <LinearProgress sx={{ height: 2 }} />}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Verdict */}
      {checks.length > 0 && (
        <Box
          sx={{
            p: 2, mb: 2, borderRadius: 2,
            border: '1px solid', borderColor: tint(STATUS_STYLE[verdict].color, 0.4),
            background: `linear-gradient(135deg, ${tint(STATUS_STYLE[verdict].color, 0.18)} 0%, ${tint(STATUS_STYLE[verdict].color, 0.04)} 100%)`,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <VerdictIcon sx={{ fontSize: 30, color: STATUS_STYLE[verdict].color }} />
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.98rem' }}>{verdictText}</Typography>
              <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary' }}>
                {counts.pass} đạt · {counts.warn} cần chú ý · {counts.fail} không đạt
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}

      {/* Checks */}
      {checks.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <SectionTitle>Kiểm tra yêu cầu</SectionTitle>
          <Stack gap={1}>
            {checks.map(({ label, res }) => {
              const st = STATUS_STYLE[res.status]
              return (
                <Stack
                  key={label} direction="row" gap={1.25}
                  sx={{ p: 1.25, borderRadius: 1.5, bgcolor: tint(st.color, 0.07), border: '1px solid', borderColor: tint(st.color, 0.2) }}
                >
                  <st.Icon sx={{ fontSize: 20, color: st.color, mt: 0.1 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{label}</Typography>
                    <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary', lineHeight: 1.45 }}>{res.detail}</Typography>
                  </Box>
                </Stack>
              )
            })}
          </Stack>
        </Box>
      )}

      {/* Key outputs */}
      {tiles.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <SectionTitle>Kết quả tính toán</SectionTitle>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1 }}>
            {tiles.map((id, i) => {
              const step = result?.steps[id]
              const unit = paramById[id]?.unit
              const primary = i < 2
              return (
                <Tooltip key={id} title={step?.formula_name ? `Tính từ: ${step.formula_name}` : ''} placement="top">
                  <Box
                    sx={{
                      p: 1.25, borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: primary ? tint(scenario.accent, 0.45) : 'divider',
                      background: primary
                        ? `linear-gradient(135deg, ${tint(scenario.accent, 0.2)} 0%, ${tint(scenario.accent, 0.05)} 100%)`
                        : 'rgba(148,163,184,0.04)',
                    }}
                  >
                    <Typography noWrap sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{labelOf(id, paramById)}</Typography>
                    <Typography sx={{ fontFamily: MONO_FONT, fontWeight: 700, fontSize: primary ? '1.15rem' : '0.98rem', color: primary ? '#F1F5F9' : '#E2E8F0' }}>
                      {formatNumber(values[id])}
                      {unit && <Box component="span" sx={{ fontSize: '0.7rem', fontWeight: 500, color: 'text.secondary', ml: 0.5 }}>{unit}</Box>}
                    </Typography>
                  </Box>
                </Tooltip>
              )
            })}
          </Box>
        </Box>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <SectionTitle>Gợi ý</SectionTitle>
          <Stack gap={0.75}>
            {suggestions.map(s => (
              <Stack key={s} direction="row" gap={1} alignItems="flex-start">
                <TipIcon sx={{ fontSize: 16, color: TONE.warning, mt: 0.2 }} />
                <Typography sx={{ fontSize: '0.78rem', lineHeight: 1.5 }}>{s}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      {result && (
        <Box sx={{ mb: 2.5 }}>
          <Recommendations values={values} accent={scenario.accent} />
        </Box>
      )}

      {/* Step-by-step */}
      {steps.length > 0 && (
        <Accordion disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}>
            <Stack direction="row" alignItems="center" gap={1}>
              <FormulaIcon sx={{ fontSize: 18, color: scenario.accent }} />
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>Cách tính từng bước ({steps.length})</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <StepList steps={steps} accent={scenario.accent} paramById={paramById} />
          </AccordionDetails>
        </Accordion>
      )}

      {engineWarnings.length > 0 && (
        <Stack gap={1} sx={{ mt: 2 }}>
          {engineWarnings.map((w, i) => (
            <Alert key={i} severity={w.severity === 'error' ? 'error' : 'warning'} sx={{ fontSize: '0.74rem', py: 0 }}>
              {w.message}
            </Alert>
          ))}
        </Stack>
      )}

      {!result && !loading && !error && (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>Nhập thông số để xem kết quả.</Typography>
      )}
    </Box>
  )
}

export default ResultsPanel
