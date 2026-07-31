import React from 'react'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import type { BlurResult } from '@/types/imageQuality'
import HeatmapCanvas from '../LightingCalibration/HeatmapCanvas'

const TYPE_COLOR: Record<string, string> = {
  none: '#10B981', slight: '#3B82F6', moderate: '#F59E0B',
  severe: '#EF4444', motion: '#EF4444', defocus: '#F59E0B', gaussian: '#F59E0B',
}

interface Props { blur: BlurResult }

const BlurPanel: React.FC<Props> = ({ blur }) => {
  const color = TYPE_COLOR[blur.blur_type] ?? '#94a3b8'
  const severityPct = blur.severity_score * 100

  return (
    <Box>
      <Stack direction="row" gap={1} mb={2} flexWrap="wrap" alignItems="center">
        <Chip label={blur.blur_type.toUpperCase()} size="small"
          sx={{ bgcolor: `${color}22`, color, fontWeight: 700 }} />
        <Chip label={`Severity: ${severityPct.toFixed(0)}%`} size="small" />
        {blur.motion_angle != null && (
          <Chip label={`Direction: ${blur.motion_angle}°`} size="small" sx={{ color: '#EF4444' }} />
        )}
        {blur.motion_length != null && (
          <Chip label={`Length: ~${blur.motion_length} px`} size="small" />
        )}
      </Stack>

      {/* Severity bar */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Blur severity</Typography>
        <Box sx={{ mt: 0.5, height: 10, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: `${severityPct}%`, bgcolor: color, borderRadius: 5, transition: 'width 0.5s' }} />
        </Box>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>No blur</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Severe</Typography>
        </Stack>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={3} alignItems="flex-start">
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            Blur map (red = most blurry)
          </Typography>
          <HeatmapCanvas
            data={blur.blur_map}
            rows={blur.blur_map_rows}
            cols={blur.blur_map_cols}
            width={300}
            height={200}
          />
        </Box>

        <Stack gap={1.5} flex={1}>
          <Paper variant="outlined" sx={{ p: 2, borderColor: `${color}44` }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Blur Type</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color }}>
              {blur.blur_type.charAt(0).toUpperCase() + blur.blur_type.slice(1)}
            </Typography>
            {blur.blur_type === 'motion' && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Reduce exposure time or use strobe lighting to freeze motion
              </Typography>
            )}
            {blur.blur_type === 'defocus' && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Check focus distance and depth of field for this lens
              </Typography>
            )}
          </Paper>
          {blur.motion_angle != null && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Estimated Motion Direction</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                {blur.motion_angle}°
              </Typography>
            </Paper>
          )}
        </Stack>
      </Stack>
    </Box>
  )
}

export default BlurPanel
