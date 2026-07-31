import React from 'react'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import type { NoiseResult, SNRResult } from '@/types/lighting'
import HeatmapCanvas from './HeatmapCanvas'

const SNR_COLOR: Record<string, string> = {
  excellent: '#10B981',
  good: '#F59E0B',
  poor: '#EF4444',
}

interface Props { noise: NoiseResult; snr: SNRResult }

const NoisePanel: React.FC<Props> = ({ noise, snr }) => {
  const color = SNR_COLOR[snr.status]

  const stats = [
    { label: 'Spatial Noise Mean',  value: noise.spatial_mean.toFixed(4) },
    { label: 'Spatial Noise Std',   value: noise.spatial_std.toFixed(4) },
    { label: 'Temporal Noise Mean', value: noise.temporal_mean.toFixed(4) },
    { label: 'Temporal Noise Std',  value: noise.temporal_std.toFixed(4) },
  ]

  return (
    <Box>
      <Stack direction="row" gap={1} mb={2} flexWrap="wrap" alignItems="center">
        <Chip
          label={`SNR: ${snr.snr_db} dB — ${snr.status.toUpperCase()}`}
          size="small"
          sx={{ bgcolor: `${color}22`, color, fontWeight: 700 }}
        />
        <Chip label={`Linear SNR: ${snr.snr_linear}×`} size="small" />
        <Chip label="Recommended: ≥ 40 dB" size="small" variant="outlined" />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={3} alignItems="flex-start">
        {/* Noise map heatmap */}
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            Noise distribution map
          </Typography>
          <HeatmapCanvas
            data={noise.noise_map}
            rows={noise.noise_map_rows}
            cols={noise.noise_map_cols}
            width={300}
            height={200}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            Blue = low noise · Red = high noise
          </Typography>
        </Box>

        {/* Stats */}
        <Stack gap={1.5} flex={1}>
          {/* SNR gauge */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: `${color}44` }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Signal-to-Noise Ratio</Typography>
            <Stack direction="row" alignItems="baseline" gap={1}>
              <Typography variant="h3" sx={{ fontFamily: 'monospace', fontWeight: 800, color }}>
                {snr.snr_db}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>dB</Typography>
            </Stack>
            {/* SNR bar */}
            <Box sx={{ mt: 1, height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <Box sx={{
                height: '100%',
                width: `${Math.min(100, (snr.snr_db / 60) * 100)}%`,
                bgcolor: color,
                borderRadius: 4,
                transition: 'width 0.5s',
              }} />
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>0 dB (poor) → 60 dB (excellent)</Typography>
          </Paper>

          {/* Noise stats */}
          <Stack direction="row" gap={1} flexWrap="wrap">
            {stats.map(({ label, value }) => (
              <Paper key={label} variant="outlined" sx={{ p: 1.5, flex: 1, minWidth: 130 }}>
                <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{value}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}

export default NoisePanel
