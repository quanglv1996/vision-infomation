import React from 'react'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import type { ExposureResult, NoiseQualityResult } from '@/types/imageQuality'
import HeatmapCanvas from '../LightingCalibration/HeatmapCanvas'

const SCORE_COLOR = (s: number) =>
  s >= 75 ? '#10B981' : s >= 50 ? '#F59E0B' : '#EF4444'

interface Props { noise: NoiseQualityResult; exposure: ExposureResult }

const NoiseExposurePanel: React.FC<Props> = ({ noise, exposure }) => {
  const nc = SCORE_COLOR(noise.noise_score)
  const ec = exposure.status === 'pass' ? '#10B981' : exposure.status === 'warning' ? '#F59E0B' : '#EF4444'

  return (
    <Box>
      {/* Noise section */}
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Noise Analysis</Typography>
      <Stack direction="row" gap={1} mb={2} flexWrap="wrap">
        <Chip label={`Score: ${noise.noise_score}/100`} size="small" sx={{ bgcolor: `${nc}22`, color: nc, fontWeight: 700 }} />
        <Chip label={`σ = ${noise.estimated_std.toFixed(4)}`} size="small" />
        <Chip label={`Salt & Pepper: ${noise.salt_pepper_pct.toFixed(3)}%`} size="small"
          sx={{ color: noise.salt_pepper_pct > 0.5 ? '#EF4444' : undefined }} />
      </Stack>
      <Box sx={{ mb: 2, height: 8, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <Box sx={{ height: '100%', width: `${noise.noise_score}%`, bgcolor: nc, borderRadius: 4, transition: 'width 0.5s' }} />
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={3} mb={4} alignItems="flex-start">
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>Noise distribution map</Typography>
          <HeatmapCanvas
            data={noise.noise_map}
            rows={noise.noise_map_rows}
            cols={noise.noise_map_cols}
            width={280}
            height={180}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Blue = low · Red = high noise</Typography>
        </Box>
        <Stack gap={1.5} flex={1}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Estimated Gaussian Noise (σ)</Typography>
            <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 800, color: nc }}>{noise.estimated_std.toFixed(4)}</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>Estimated via MAD residual method</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Salt & Pepper Pixels</Typography>
            <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{noise.salt_pepper_pct.toFixed(3)}%</Typography>
          </Paper>
        </Stack>
      </Stack>

      {/* Exposure section */}
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Exposure Evaluation</Typography>
      <Stack direction="row" gap={1} mb={2} flexWrap="wrap">
        <Chip label={exposure.status.toUpperCase()} size="small" sx={{ bgcolor: `${ec}22`, color: ec, fontWeight: 700 }} />
        <Chip label={`Score: ${exposure.exposure_score}/100`} size="small" sx={{ color: ec }} />
        <Chip label={`Mean brightness: ${exposure.mean_brightness_pct}%`} size="small" />
        {exposure.is_overexposed  && <Chip label={`Overexposed: ${exposure.overexposed_pct}%`}  size="small" sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#EF4444' }} />}
        {exposure.is_underexposed && <Chip label={`Underexposed: ${exposure.underexposed_pct}%`} size="small" sx={{ bgcolor: 'rgba(59,130,246,0.15)', color: '#3B82F6' }} />}
      </Stack>
      <Box sx={{ mb: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Brightness level (optimal: 40–60%)</Typography>
        <Box sx={{ mt: 0.5, height: 12, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
          <Box sx={{ height: '100%', width: `${exposure.mean_brightness_pct}%`, bgcolor: ec, borderRadius: 4, transition: 'width 0.5s' }} />
          {/* Reference markers */}
          <Box sx={{ position: 'absolute', top: 0, left: '40%', height: '100%', width: 1, bgcolor: '#10B98166' }} />
          <Box sx={{ position: 'absolute', top: 0, left: '60%', height: '100%', width: 1, bgcolor: '#10B98166' }} />
        </Box>
        <Stack direction="row" justifyContent="space-between" mt={0.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>0%</Typography>
          <Typography variant="caption" sx={{ color: '#10B981' }}>Optimal (40–60%)</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>100%</Typography>
        </Stack>
      </Box>
    </Box>
  )
}

export default NoiseExposurePanel
