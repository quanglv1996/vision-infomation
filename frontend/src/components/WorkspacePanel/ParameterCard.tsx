import React from 'react'
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  GpsFixed as TargetIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import type { Parameter, ParameterState } from '@/types'
import { STATUS_COLORS } from '@/theme/theme'
import { useCalcStore } from '@/stores/calculationStore'

interface ParameterCardProps {
  param: Parameter
  state: ParameterState
}

const ParameterCard: React.FC<ParameterCardProps> = ({ param, state }) => {
  const { setParamValue, toggleTarget, selectParam, selectedParamId } = useCalcStore()

  const status = state.status
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.unknown
  const isSelected = selectedParamId === param.id

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim()
    if (raw === '' || raw === '-') {
      setParamValue(param.id, null)
      return
    }
    const num = parseFloat(raw)
    if (!isNaN(num)) setParamValue(param.id, num)
  }

  return (
    <Paper
      elevation={0}
      onClick={() => selectParam(param.id)}
      sx={{
        p: 1.5,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: isSelected ? color : 'divider',
        borderRadius: 1.5,
        position: 'relative',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        '&:hover': {
          borderColor: color,
          boxShadow: `0 0 0 1px ${color}33`,
        },
      }}
    >
      {/* Status stripe */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 3,
          bgcolor: color,
          borderRadius: '6px 0 0 6px',
        }}
      />

      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={0.5}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem', lineHeight: 1.2 }}>
            {param.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {param.unit || 'dimensionless'}
          </Typography>
        </Box>

        <Stack direction="row" alignItems="center" gap={0.5}>
          <Chip
            label={status}
            size="small"
            sx={{
              bgcolor: `${color}22`,
              color,
              height: 16,
              fontSize: '0.62rem',
              fontWeight: 600,
            }}
          />
          <Tooltip title={state.isTarget ? 'Remove target' : 'Set as target'}>
            <IconButton
              size="small"
              onClick={e => { e.stopPropagation(); toggleTarget(param.id) }}
              sx={{
                p: 0.25,
                color: state.isTarget ? '#F59E0B' : 'text.secondary',
              }}
            >
              <TargetIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Input or value display */}
      {status === 'input' ? (
        <TextField
          type="number"
          value={state.value ?? ''}
          onChange={handleChange}
          onClick={e => e.stopPropagation()}
          size="small"
          fullWidth
          placeholder="Enter value…"
          inputProps={{
            step: 'any',
            min: param.min_value ?? undefined,
            max: param.max_value ?? undefined,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(59,130,246,0.06)',
              borderColor: '#3B82F6',
            },
          }}
          InputProps={{
            endAdornment: param.unit ? (
              <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap', ml: 0.5 }}>
                {param.unit}
              </Typography>
            ) : null,
          }}
        />
      ) : status === 'unknown' || status === 'missing' ? (
        <TextField
          type="number"
          value=""
          onChange={handleChange}
          onClick={e => e.stopPropagation()}
          size="small"
          fullWidth
          placeholder={status === 'missing' ? '⚠ Required' : 'Enter value…'}
          inputProps={{
            step: 'any',
            min: param.min_value ?? undefined,
            max: param.max_value ?? undefined,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: status === 'missing' ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
            },
          }}
          InputProps={{
            endAdornment: param.unit ? (
              <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap', ml: 0.5 }}>
                {param.unit}
              </Typography>
            ) : null,
          }}
        />
      ) : (
        /* calculated / inverse / target */
        <Box
          sx={{
            mt: 0.5,
            p: 0.75,
            borderRadius: 1,
            bgcolor: `${color}11`,
            border: `1px solid ${color}33`,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: '0.9rem',
              fontWeight: 600,
              color,
            }}
          >
            {formatValue(state.value ?? 0)}
            <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
              {param.unit}
            </Typography>
          </Typography>
          {state.step?.formula_name && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.3 }}>
              via {state.step.formula_name}
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  )
}

function formatValue(v: number): string {
  if (Math.abs(v) < 0.0001 && v !== 0) return v.toExponential(3)
  if (Math.abs(v) >= 100000) return v.toExponential(3)
  const s = v.toPrecision(5)
  // Remove trailing zeros after decimal
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s
}

export default ParameterCard
