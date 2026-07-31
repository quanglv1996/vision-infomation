import React from 'react'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import type { SharpnessResult } from '@/types/imageQuality'
import HeatmapCanvas from '../LightingCalibration/HeatmapCanvas'

const STATUS_COLOR: Record<string, string> = {
  sharp: '#10B981', acceptable: '#F59E0B', blurry: '#EF4444',
}

interface Props { sharpness: SharpnessResult }

const SharpnessPanel: React.FC<Props> = ({ sharpness }) => {
  const color = STATUS_COLOR[sharpness.status] ?? '#94a3b8'

  const metrics = [
    { label: 'Laplacian Variance', value: sharpness.laplacian_variance.toFixed(1), tip: '>1000 = sharp' },
    { label: 'Tenengrad',          value: sharpness.tenengrad.toFixed(1),           tip: 'Sobel energy mean' },
    { label: 'Brenner',            value: sharpness.brenner.toFixed(1),             tip: 'Forward diff² mean' },
    { label: 'Sobel Energy',       value: sharpness.sobel_energy.toFixed(2),        tip: '√(Gx²+Gy²) mean' },
    { label: 'FFT Sharpness',      value: sharpness.fft_sharpness.toFixed(4),       tip: 'High-freq energy ratio' },
  ]

  return (
    <Box>
      <Stack direction="row" gap={1} mb={2} flexWrap="wrap" alignItems="center">
        <Chip label={sharpness.status.toUpperCase()} size="small"
          sx={{ bgcolor: `${color}22`, color, fontWeight: 700 }} />
        <Chip label={`Score: ${sharpness.sharpness_score}/100`} size="small"
          sx={{ color }} />
      </Stack>

      {/* Score bar */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Sharpness score</Typography>
        <Box sx={{ mt: 0.5, height: 10, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: `${sharpness.sharpness_score}%`, bgcolor: color, borderRadius: 5, transition: 'width 0.5s' }} />
        </Box>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={3} alignItems="flex-start">
        {/* Focus map */}
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            Focus map (red = sharp, blue = blurry)
          </Typography>
          <HeatmapCanvas
            data={sharpness.focus_map}
            rows={sharpness.focus_map_rows}
            cols={sharpness.focus_map_cols}
            width={300}
            height={200}
          />
        </Box>

        {/* Metrics grid */}
        <Stack gap={1} flex={1} flexWrap="wrap" direction="row">
          {metrics.map(({ label, value, tip }) => (
            <Paper key={label} variant="outlined" sx={{ p: 1.5, flex: '1 1 140px' }}>
              <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{value}</Typography>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>{label}</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>{tip}</Typography>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}

export default SharpnessPanel
