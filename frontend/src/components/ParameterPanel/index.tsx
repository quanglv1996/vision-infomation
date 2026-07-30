import React, { useMemo } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import { useCalcStore } from '@/stores/calculationStore'
import { STATUS_COLORS } from '@/theme/theme'

const ParameterPanel: React.FC = () => {
  const { parameterGroups, params, selectedParamId, selectParam } = useCalcStore()

  const groupStats = useMemo(() => {
    const stats: Record<string, { total: number; filled: number }> = {}
    for (const group of parameterGroups) {
      let filled = 0
      for (const p of group.parameters) {
        const state = params[p.id]
        if (state && state.value !== null) filled++
      }
      stats[group.category] = { total: group.parameters.length, filled }
    }
    return stats
  }, [parameterGroups, params])

  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        p: 1,
        bgcolor: 'background.default',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        variant="caption"
        sx={{ px: 1, py: 0.5, display: 'block', color: 'text.secondary', letterSpacing: 1, textTransform: 'uppercase' }}
      >
        Parameters
      </Typography>

      {parameterGroups.map(group => {
        const stats = groupStats[group.category] || { total: 0, filled: 0 }
        return (
          <Accordion key={group.category} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%', pr: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                  {group.category}
                </Typography>
                {stats.filled > 0 && (
                  <Chip
                    label={`${stats.filled}/${stats.total}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(59,130,246,0.15)', color: '#3B82F6', height: 16, fontSize: '0.62rem' }}
                  />
                )}
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List dense disablePadding>
                {group.parameters.map(param => {
                  const state = params[param.id]
                  const status = state?.status ?? 'unknown'
                  const dotColor = STATUS_COLORS[status] ?? STATUS_COLORS.unknown
                  return (
                    <ListItemButton
                      key={param.id}
                      selected={selectedParamId === param.id}
                      onClick={() => selectParam(param.id === selectedParamId ? null : param.id)}
                      sx={{ py: 0.3, px: 1.5, gap: 1 }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: dotColor,
                          flexShrink: 0,
                        }}
                      />
                      <ListItemText
                        primary={param.name}
                        secondary={param.unit || '—'}
                        primaryTypographyProps={{ variant: 'body2', sx: { fontSize: '0.75rem' } }}
                        secondaryTypographyProps={{ variant: 'caption', sx: { fontSize: '0.65rem' } }}
                      />
                      {state?.value !== null && state?.value !== undefined && (
                        <Typography
                          variant="caption"
                          sx={{ color: dotColor, fontFamily: 'monospace', fontSize: '0.68rem', ml: 'auto' }}
                        >
                          {formatValue(state.value)}
                        </Typography>
                      )}
                    </ListItemButton>
                  )
                })}
              </List>
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Box>
  )
}

function formatValue(v: number): string {
  if (Math.abs(v) < 0.001 && v !== 0) return v.toExponential(2)
  if (Math.abs(v) >= 10000) return v.toExponential(2)
  return v.toPrecision(4).replace(/\.?0+$/, '')
}

export default ParameterPanel
