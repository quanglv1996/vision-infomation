import React from 'react'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import type { UniformityResult } from '@/types/lighting'
import HeatmapCanvas from './HeatmapCanvas'

const STATUS_COLORS: Record<string, string> = {
  excellent: '#10B981',
  good: '#3B82F6',
  acceptable: '#F59E0B',
  bad: '#EF4444',
}

interface Props { uniformity: UniformityResult }

const UniformityPanel: React.FC<Props> = ({ uniformity }) => {
  const color = STATUS_COLORS[uniformity.status] ?? '#94a3b8'

  const criteria = [
    { label: 'Excellent', range: '≥ 95%',  color: '#10B981' },
    { label: 'Good',      range: '90–95%', color: '#3B82F6' },
    { label: 'Acceptable',range: '80–90%', color: '#F59E0B' },
    { label: 'Bad',       range: '< 80%',  color: '#EF4444' },
  ]

  return (
    <Box>
      <Stack direction="row" gap={1} mb={2} flexWrap="wrap" alignItems="center">
        <Chip
          label={uniformity.status.toUpperCase()}
          size="small"
          sx={{ bgcolor: `${color}22`, color, fontWeight: 700 }}
        />
        <Chip label={`Min/Max: ${uniformity.uniformity_min_max}%`} size="small" />
        <Chip label={`CV: ${uniformity.uniformity_cv}%`} size="small" />
      </Stack>

      <Stack direction="row" gap={3} mb={3} flexWrap="wrap">
        {criteria.map(c => (
          <Stack key={c.label} direction="row" alignItems="center" gap={0.5}>
            <Box sx={{ width: 10, height: 10, bgcolor: c.color, borderRadius: '50%' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {c.label} ({c.range})
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={3} alignItems="flex-start">
        {/* Heatmap */}
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            Brightness uniformity heatmap (jet colormap)
          </Typography>
          <HeatmapCanvas
            data={uniformity.heatmap_data}
            rows={uniformity.heatmap_rows}
            cols={uniformity.heatmap_cols}
            width={300}
            height={200}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            Blue = dark · Red = bright
          </Typography>
        </Box>

        {/* Stats */}
        <Stack gap={1.5} flex={1}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Method 1 — Min / Max</Typography>
            <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 700, color }}>
              {uniformity.uniformity_min_max}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Ratio of darkest to brightest region
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Method 2 — Coefficient of Variation</Typography>
            <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 700, color }}>
              {uniformity.uniformity_cv}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              1 – Std/Mean  (higher = more uniform)
            </Typography>
          </Paper>
        </Stack>
      </Stack>
    </Box>
  )
}

export default UniformityPanel
