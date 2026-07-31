import React from 'react'
import { Alert, Box, Chip, Stack, Typography } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ColorResult } from '@/types/imageQuality'

interface Props { color: ColorResult | null }

const ColorPanel: React.FC<Props> = ({ color }) => {
  if (!color) {
    return <Alert severity="info">Color analysis is only available for color (RGB) images.</Alert>
  }

  const step = Math.max(1, Math.floor(color.histogram_bins.length / 64))
  const chartData = color.histogram_bins
    .filter((_, i) => i % step === 0)
    .map((bin, i) => ({
      bin: Math.round(bin),
      R: color.histogram_r[i * step] ?? 0,
      G: color.histogram_g[i * step] ?? 0,
      B: color.histogram_b[i * step] ?? 0,
    }))

  const castColor: Record<string, string> = { red: '#EF4444', green: '#10B981', blue: '#3B82F6' }
  const wbColor = color.white_balance_score >= 80 ? '#10B981' : color.white_balance_score >= 60 ? '#F59E0B' : '#EF4444'

  return (
    <Box>
      <Stack direction="row" gap={1} mb={2} flexWrap="wrap">
        <Chip label={`WB Score: ${color.white_balance_score}/100`} size="small"
          sx={{ bgcolor: `${wbColor}22`, color: wbColor, fontWeight: 700 }} />
        {color.has_color_cast && color.dominant_cast && (
          <Chip
            label={`Color cast: ${color.dominant_cast}`}
            size="small"
            sx={{ bgcolor: `${castColor[color.dominant_cast]}22`, color: castColor[color.dominant_cast] }}
          />
        )}
        <Chip label={`R: ${color.mean_r.toFixed(1)}`} size="small" sx={{ color: '#EF4444' }} />
        <Chip label={`G: ${color.mean_g.toFixed(1)}`} size="small" sx={{ color: '#10B981' }} />
        <Chip label={`B: ${color.mean_b.toFixed(1)}`} size="small" sx={{ color: '#3B82F6' }} />
      </Stack>

      {color.has_color_cast && (
        <Typography variant="caption" sx={{ color: '#F59E0B', display: 'block', mb: 1 }}>
          ⚠ Color cast detected — adjust white balance or use neutral gray reference
        </Typography>
      )}

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
        RGB channel histograms
      </Typography>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barCategoryGap={0}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="bin" tick={{ fontSize: 9, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="R" fill="#EF444488" barSize={4} />
          <Bar dataKey="G" fill="#10B98188" barSize={4} />
          <Bar dataKey="B" fill="#3B82F688" barSize={4} />
        </BarChart>
      </ResponsiveContainer>

      {/* White balance indicator */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
          White balance score
        </Typography>
        <Box sx={{ height: 10, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: `${color.white_balance_score}%`, bgcolor: wbColor, borderRadius: 5, transition: 'width 0.5s' }} />
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {color.white_balance_score >= 80 ? '✓ White balance is good' : 'Adjust white balance — R/G/B channels are unequal'}
        </Typography>
      </Box>
    </Box>
  )
}

export default ColorPanel
