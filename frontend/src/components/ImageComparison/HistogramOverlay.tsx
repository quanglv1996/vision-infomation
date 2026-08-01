import React, { useState } from 'react'
import { Box, Chip, Stack, Tab, Tabs, Typography } from '@mui/material'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { ComparisonResult } from '@/types/imageComparison'

interface Props { result: ComparisonResult; colors: string[] }

type HistMode = 'gray' | 'r' | 'g' | 'b'

const HistogramOverlay: React.FC<Props> = ({ result, colors }) => {
  const [mode, setMode] = useState<HistMode>('gray')
  const m = result.metrics
  const hasColor = m.some(x => x.is_color)

  // Build chart data: one row per bin, one key per image
  const bins = m[0]?.histogram_bins ?? []
  const chartData = bins.map((bin, i) => {
    const entry: Record<string, unknown> = { bin: Math.round(bin) }
    m.forEach(img => {
      const hist = mode === 'gray' ? img.histogram_gray
        : mode === 'r' ? img.histogram_r
        : mode === 'g' ? img.histogram_g
        : img.histogram_b
      entry[img.name] = hist?.[i] ?? 0
    })
    return entry
  })

  const modeColors: Record<HistMode, string> = {
    gray: '#9CA3AF', r: '#EF4444', g: '#10B981', b: '#3B82F6',
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">Histogram Overlay</Typography>
        {hasColor && (
          <Tabs value={mode} onChange={(_, v) => setMode(v)}
            sx={{ minHeight: 28, '& .MuiTab-root': { minHeight: 28, fontSize: '0.7rem', py: 0.3 } }}>
            <Tab value="gray" label="Gray" />
            <Tab value="r" label="Red" sx={{ color: '#EF4444' }} />
            <Tab value="g" label="Green" sx={{ color: '#10B981' }} />
            <Tab value="b" label="Blue" sx={{ color: '#3B82F6' }} />
          </Tabs>
        )}
      </Stack>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="bin" tick={{ fontSize: 9, fill: '#6B7280' }} interval={7}
            label={{ value: 'Pixel Value', position: 'insideBottomRight', fill: '#6B7280', fontSize: 10 }} />
          <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }} />
          <Tooltip contentStyle={{ background: '#1e2329', border: '1px solid #374151', fontSize: '0.72rem' }} />
          <Legend iconSize={10} iconType="line" wrapperStyle={{ fontSize: '0.72rem' }} />
          {m.map((img, i) => (
            <Line
              key={img.index} type="monotone" dataKey={img.name}
              stroke={colors[i % colors.length]} dot={false}
              strokeWidth={1.5} strokeOpacity={0.8}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Brightness stats below */}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>Brightness Statistics</Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.5}>
        {m.map((img, i) => (
          <Box key={img.index} sx={{ p: 1, border: '1px solid', borderColor: colors[i%colors.length]+'55',
            borderRadius: 1, bgcolor: colors[i%colors.length]+'0a', minWidth: 110 }}>
            <Typography variant="caption" sx={{ color: colors[i%colors.length], fontWeight: 700, display: 'block' }}>
              {img.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>
              Mean: {img.mean_brightness.toFixed(1)}%<br />
              Std: {img.std_brightness.toFixed(1)}%<br />
              DR: {img.dynamic_range_pct.toFixed(1)}%
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

export default HistogramOverlay
