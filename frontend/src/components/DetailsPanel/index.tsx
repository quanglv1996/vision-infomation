import React from 'react'
import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Calculate as CalcIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { useCalcStore } from '@/stores/calculationStore'
import { STATUS_COLORS } from '@/theme/theme'

const DetailsPanel: React.FC = () => {
  const { selectedParamId, params, parameterGroups, lastResult } = useCalcStore()

  if (!selectedParamId) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          bgcolor: 'background.default',
          borderLeft: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack alignItems="center" gap={1}>
          <InfoIcon sx={{ color: 'text.secondary', fontSize: 32, opacity: 0.4 }} />
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Click any parameter to see details, formula explanation, and history
          </Typography>
        </Stack>
      </Box>
    )
  }

  const state = params[selectedParamId]
  const status = state?.status ?? 'unknown'
  const color = STATUS_COLORS[status]

  // Find parameter metadata
  const paramMeta = parameterGroups
    .flatMap(g => g.parameters)
    .find(p => p.id === selectedParamId)

  const step = state?.step

  // Find related formulas (outputs this param, or takes it as input)
  const allFormulas: Array<{ id: string; name: string; expression: string; inputs: string[]; output: string }> = []
  if (lastResult) {
    for (const s of Object.values(lastResult.steps)) {
      if (
        s.formula_id &&
        !s.formula_id.endsWith(':inverse') &&
        (s.parameter_id === selectedParamId ||
          Object.keys(s.input_values).includes(selectedParamId))
      ) {
        allFormulas.push({
          id: s.formula_id,
          name: s.formula_name ?? s.formula_id,
          expression: s.expression ?? '',
          inputs: Object.keys(s.input_values),
          output: s.parameter_id,
        })
      }
    }
  }

  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        p: 2,
        bgcolor: 'background.default',
        borderLeft: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {paramMeta?.name ?? selectedParamId}
          </Typography>
          <Stack direction="row" gap={1} alignItems="center" mt={0.5}>
            <Chip
              label={status}
              size="small"
              sx={{ bgcolor: `${color}22`, color, height: 18, fontSize: '0.65rem', fontWeight: 700 }}
            />
            {paramMeta?.unit && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                [{paramMeta.unit}]
              </Typography>
            )}
          </Stack>
        </Box>
        {state?.value !== null && state?.value !== undefined && (
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              bgcolor: `${color}15`,
              border: `1px solid ${color}44`,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                color,
                lineHeight: 1.1,
              }}
            >
              {fmtPrecise(state.value)}
            </Typography>
          </Box>
        )}
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {/* Description */}
      {paramMeta?.description && (
        <Box mb={1.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Description
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
            {paramMeta.description}
          </Typography>
          {paramMeta.typical_range && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.3 }}>
              Typical range: {paramMeta.typical_range[0]} – {paramMeta.typical_range[1]} {paramMeta.unit}
            </Typography>
          )}
        </Box>
      )}

      {/* Formula explanation */}
      {step && step.formula_name && (
        <>
          <Divider sx={{ mb: 1.5 }} />
          <Box mb={1.5}>
            <Stack direction="row" alignItems="center" gap={0.5} mb={0.75}>
              <CalcIcon sx={{ fontSize: 14, color: color }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Calculation
              </Typography>
            </Stack>

            <Paper
              variant="outlined"
              sx={{ p: 1.5, bgcolor: `${color}08`, borderColor: `${color}33` }}
            >
              <Typography variant="caption" sx={{ color, display: 'block', mb: 0.5, fontWeight: 600 }}>
                {step.formula_name}
              </Typography>
              <Box
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.78rem',
                  color: 'text.primary',
                  bgcolor: 'rgba(0,0,0,0.2)',
                  p: 0.75,
                  borderRadius: 0.5,
                  overflowX: 'auto',
                }}
              >
                <span style={{ color: '#10B981' }}>{paramMeta?.name ?? selectedParamId}</span>
                {' = '}
                <span style={{ color: '#94A3B8' }}>{step.expression}</span>
              </Box>

              {/* Input values */}
              {Object.keys(step.input_values).length > 0 && (
                <Box mt={1}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    Substituting:
                  </Typography>
                  <Table size="small" padding="none">
                    <TableBody>
                      {Object.entries(step.input_values).map(([pid, val]) => {
                        const meta = parameterGroups.flatMap(g => g.parameters).find(p => p.id === pid)
                        return (
                          <TableRow key={pid} sx={{ '& td': { border: 0, py: 0.2 } }}>
                            <TableCell sx={{ color: '#3B82F6', fontFamily: 'monospace', fontSize: '0.75rem', width: 140 }}>
                              {meta?.name ?? pid}
                            </TableCell>
                            <TableCell sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                              =
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.primary' }}>
                              {fmtPrecise(val)} {meta?.unit}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {/* Result */}
              <Box mt={1} sx={{ pt: 0.75, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Result:{' '}
                  <span style={{ color, fontFamily: 'monospace', fontWeight: 700 }}>
                    {fmtPrecise(state?.value ?? 0)} {paramMeta?.unit}
                  </span>
                </Typography>
              </Box>
            </Paper>
          </Box>
        </>
      )}

      {/* Warnings for this parameter */}
      {lastResult && lastResult.warnings.filter(w => w.parameter_id === selectedParamId).map(w => (
        <Paper
          key={w.message}
          variant="outlined"
          sx={{
            p: 1,
            mb: 1,
            bgcolor: w.severity === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
            borderColor: w.severity === 'error' ? '#EF4444' : '#F59E0B',
          }}
        >
          <Typography variant="caption" sx={{ color: w.severity === 'error' ? '#EF4444' : '#F59E0B' }}>
            {w.message}
          </Typography>
        </Paper>
      ))}
    </Box>
  )
}

function fmtPrecise(v: number): string {
  if (Math.abs(v) < 0.0001 && v !== 0) return v.toExponential(4)
  if (Math.abs(v) >= 1e6) return v.toExponential(4)
  return parseFloat(v.toPrecision(6)).toString()
}

export default DetailsPanel
