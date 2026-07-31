import React from 'react'
import { Box, Chip, Grid, Stack, Typography } from '@mui/material'
import type { ColorCalibrationResult } from '@/types/colorCalibration'

interface Props { result: ColorCalibrationResult }

const IlluminantBadge: Record<string, string> = {
  D65: '#3B82F6', D50: '#60A5FA', A: '#F97316', F11: '#A78BFA', D75: '#93C5FD', Unknown: '#6B7280',
}

const WhitePointPanel: React.FC<Props> = ({ result: { white_point: wp } }) => {
  const illColor = IlluminantBadge[wp.illuminant] ?? '#9CA3AF'

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">White Point &amp; Color Temperature</Typography>
        <Chip label={`Illuminant: ${wp.illuminant}`} size="small"
          sx={{ bgcolor: illColor + '22', color: illColor, fontWeight: 700 }} />
      </Stack>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: 'Chromaticity x',   value: wp.chromaticity_x.toFixed(5), sub: 'CIE xy' },
          { label: 'Chromaticity y',   value: wp.chromaticity_y.toFixed(5), sub: 'CIE xy' },
          { label: 'Color Temperature',value: `${wp.color_temperature_k.toFixed(0)} K`, sub: 'CCT (McCamy)' },
          { label: 'Tint',             value: `${wp.tint > 0 ? '+' : ''}${wp.tint.toFixed(1)}`, sub: wp.tint < -15 ? 'Green shift' : wp.tint > 15 ? 'Magenta shift' : 'Neutral' },
        ].map(m => (
          <Grid item xs={6} sm={3} key={m.label}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">{m.label}</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{m.value}</Typography>
              <Typography variant="caption" color="text.disabled">{m.sub}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Chromaticity diagram placeholder */}
      <Typography variant="body2" color="text.secondary" gutterBottom>White Point Position (CIE xy)</Typography>
      <Box sx={{ position: 'relative', width: 320, height: 180, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        {/* Background gradient simulating chromaticity diagram */}
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1e3a5f 0%, #1a4a2e 40%, #5a3a00 80%, #3a0a0a 100%)', opacity: 0.4 }} />
        {/* Reference points */}
        {[
          { label: 'D65', x: 0.3127, y: 0.3290, color: '#3B82F6' },
          { label: 'D50', x: 0.3457, y: 0.3585, color: '#60A5FA' },
        ].map(ref => (
          <Box key={ref.label} sx={{
            position: 'absolute',
            left: `${(ref.x - 0.25) / 0.25 * 100}%`,
            top: `${(1 - (ref.y - 0.25) / 0.25) * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ref.color, border: '1px solid white' }} />
            <Typography variant="caption" sx={{ color: ref.color, fontSize: '0.6rem', display: 'block' }}>{ref.label}</Typography>
          </Box>
        ))}
        {/* Measured white point */}
        <Box sx={{
          position: 'absolute',
          left: `${Math.max(0, Math.min(100, (wp.chromaticity_x - 0.25) / 0.25 * 100))}%`,
          top: `${Math.max(0, Math.min(100, (1 - (wp.chromaticity_y - 0.25) / 0.25) * 100))}%`,
          transform: 'translate(-50%, -50%)',
        }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#F59E0B', boxShadow: '0 0 8px #F59E0B', border: '2px solid white' }} />
          <Typography variant="caption" sx={{ color: '#F59E0B', fontSize: '0.6rem', display: 'block', fontWeight: 700 }}>WP</Typography>
        </Box>
        <Typography variant="caption" color="text.disabled" sx={{ position: 'absolute', bottom: 4, left: 8, fontSize: '0.6rem' }}>
          CIE 1931 xy (x: 0.25–0.50, y: 0.25–0.50) — orange=measured, blue=D65
        </Typography>
      </Box>
    </Box>
  )
}

export default WhitePointPanel
