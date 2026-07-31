import React from 'react'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { BrightnessStats } from '@/types/lighting'

const STATUS_COLOR = { pass: '#10B981', warning: '#F59E0B', fail: '#EF4444' }

interface Props { brightness: BrightnessStats; maxVal: number }

const BrightnessPanel: React.FC<Props> = ({ brightness, maxVal }) => {
  const color = STATUS_COLOR[brightness.status]

  const stats = [
    { label: 'Mean',   value: brightness.mean.toFixed(1) },
    { label: 'Median', value: brightness.median.toFixed(1) },
    { label: 'Min',    value: brightness.min_val.toFixed(1) },
    { label: 'Max',    value: brightness.max_val.toFixed(1) },
    { label: 'Std',    value: brightness.std.toFixed(2) },
  ]

  // Simple gauge data: bar showing % of full scale
  const gaugeData = [
    { name: 'Used',  value: brightness.pct_of_full_scale },
    { name: 'Remaining', value: 100 - brightness.pct_of_full_scale },
  ]

  return (
    <Box>
      <Stack direction="row" gap={1} mb={2} flexWrap="wrap" alignItems="center">
        <Chip label={brightness.status.toUpperCase()} size="small"
          sx={{ bgcolor: `${color}22`, color, fontWeight: 700 }} />
        <Chip label={`${brightness.pct_of_full_scale}% of full scale`} size="small" />
        <Chip label={`Recommended: 20–80%`} size="small" variant="outlined" />
      </Stack>

      {/* Stat grid */}
      <Stack direction="row" gap={2} flexWrap="wrap" mb={2}>
        {stats.map(({ label, value }) => (
          <Paper key={label} variant="outlined" sx={{ p: 1.5, minWidth: 90, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{value}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
          </Paper>
        ))}
      </Stack>

      {/* Brightness gauge */}
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
        Brightness level (% of full scale)
      </Typography>
      <Box sx={{ height: 60 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={[{ name: '', pct: brightness.pct_of_full_scale }]}
            margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
            <YAxis type="category" dataKey="name" hide />
            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <ReferenceLine x={20} stroke="#F59E0B" strokeDasharray="4 2" />
            <ReferenceLine x={80} stroke="#F59E0B" strokeDasharray="4 2" />
            <Bar dataKey="pct" fill={color} radius={4} barSize={28} />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Yellow lines mark 20% and 80% thresholds
      </Typography>
    </Box>
  )
}

export default BrightnessPanel
