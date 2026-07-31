import React, { useMemo } from 'react'
import { Box, Chip, Stack, Typography } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { HistogramResult } from '@/types/lighting'

interface Props { histogram: HistogramResult }

const HistogramPanel: React.FC<Props> = ({ histogram }) => {
  // Downsample to 64 bins for display
  const step = Math.max(1, Math.floor(histogram.bins.length / 64))
  const chartData = useMemo(() =>
    histogram.bins
      .filter((_, i) => i % step === 0)
      .map((bin, i) => ({
        bin: Math.round(bin),
        count: histogram.counts[i * step] ?? 0,
      })),
    [histogram, step]
  )

  const peakBinVal = histogram.bins[histogram.peak_bin] ?? 0

  return (
    <Box>
      <Stack direction="row" gap={1} mb={2} flexWrap="wrap">
        <Chip
          label={`Underexposed: ${histogram.underexposed_pct}%`}
          size="small"
          sx={{ bgcolor: histogram.clipping_low ? 'rgba(239,68,68,0.15)' : undefined,
                color: histogram.clipping_low ? '#EF4444' : undefined }}
        />
        <Chip
          label={`Overexposed: ${histogram.overexposed_pct}%`}
          size="small"
          sx={{ bgcolor: histogram.clipping_high ? 'rgba(239,68,68,0.15)' : undefined,
                color: histogram.clipping_high ? '#EF4444' : undefined }}
        />
        <Chip label={`Peak at bin ${histogram.peak_bin} (value ≈ ${Math.round(peakBinVal)})`} size="small" />
      </Stack>

      {histogram.clipping_low && (
        <Typography variant="caption" sx={{ color: '#EF4444', display: 'block', mb: 1 }}>
          ⚠ Black clipping detected — increase illumination
        </Typography>
      )}
      {histogram.clipping_high && (
        <Typography variant="caption" sx={{ color: '#EF4444', display: 'block', mb: 1 }}>
          ⚠ White clipping detected — reduce exposure or gain
        </Typography>
      )}

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
        Brightness distribution (% of pixels per bin)
      </Typography>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barCategoryGap={0}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="bin" tick={{ fontSize: 10, fill: '#64748b' }}
            label={{ value: 'Gray value', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
          <Tooltip formatter={(v: number) => `${v.toFixed(4)}%`} labelFormatter={l => `Bin: ${l}`} />
          <Bar dataKey="count" barSize={6}>
            {chartData.map((entry, i) => {
              const rel = entry.bin / (histogram.bins[histogram.bins.length - 1] || 255)
              const isClipLow = entry.bin < (histogram.bins[histogram.bins.length - 1] || 255) * 0.05
              const isClipHigh = rel > 0.98
              return (
                <Cell key={i}
                  fill={isClipLow ? '#3B82F6' : isClipHigh ? '#EF4444' : '#6366F1'}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <Stack direction="row" gap={2} mt={1}>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#3B82F6', borderRadius: 0.5 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Underexposed</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#6366F1', borderRadius: 0.5 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Normal</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#EF4444', borderRadius: 0.5 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Overexposed</Typography>
        </Stack>
      </Stack>
    </Box>
  )
}

export default HistogramPanel
