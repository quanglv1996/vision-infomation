import React from 'react'
import { Box, Card, CardContent, Chip, Grid, LinearProgress, Stack, Typography } from '@mui/material'
import HeatmapCanvas from './HeatmapCanvas'
import type { GeometricCalibrationResult } from '@/types/geometricCalibration'

interface Props { result: GeometricCalibrationResult }

const CoeffCard = ({ name, value, threshold }: { name: string; value: number; threshold: number }) => {
  const pct = Math.min(100, Math.abs(value) / threshold * 100)
  const color = pct < 30 ? '#10B981' : pct < 70 ? '#F59E0B' : '#EF4444'
  return (
    <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
      <CardContent sx={{ p: '12px 16px !important' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Typography variant="caption" color="text.secondary">{name}</Typography>
          <Chip label={pct < 30 ? 'OK' : pct < 70 ? 'Moderate' : 'High'} size="small"
            sx={{ fontSize: '0.65rem', height: 18, bgcolor: color + '22', color }}
          />
        </Stack>
        <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
          {value.toFixed(6)}
        </Typography>
        <LinearProgress
          variant="determinate" value={pct}
          sx={{ mt: 0.5, height: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': { bgcolor: color } }}
        />
      </CardContent>
    </Card>
  )
}

const DistortionPanel: React.FC<Props> = ({ result: { distortion } }) => {
  const { k1, k2, k3, p1, p2, max_distortion_px, distortion_map, distortion_map_rows, distortion_map_cols } = distortion

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">Distortion Coefficients</Typography>
        <Chip
          label={`Max displacement: ${max_distortion_px.toFixed(1)} px`}
          size="small" color={max_distortion_px > 10 ? 'error' : max_distortion_px > 3 ? 'warning' : 'success'}
          variant="outlined"
        />
      </Stack>

      {/* Radial distortion */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Radial Distortion
      </Typography>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}><CoeffCard name="k1 (primary radial)"   value={k1} threshold={0.5} /></Grid>
        <Grid item xs={12} sm={4}><CoeffCard name="k2 (secondary radial)" value={k2} threshold={0.5} /></Grid>
        <Grid item xs={12} sm={4}><CoeffCard name="k3 (tertiary radial)"  value={k3} threshold={0.5} /></Grid>
      </Grid>

      {/* Tangential distortion */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Tangential Distortion (decentering)
      </Typography>
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}><CoeffCard name="p1 (tangential X)" value={p1} threshold={0.05} /></Grid>
        <Grid item xs={12} sm={6}><CoeffCard name="p2 (tangential Y)" value={p2} threshold={0.05} /></Grid>
      </Grid>

      {/* Distortion heatmap */}
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Distortion Magnitude Map (pixels displaced)
      </Typography>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <HeatmapCanvas
          data={distortion_map}
          rows={distortion_map_rows}
          cols={distortion_map_cols}
          width={320} height={220}
        />
        <Box>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1 }}>
            Color scale: blue = low, red = high displacement
          </Typography>
          {[
            { label: 'Min displacement', value: '~0 px' },
            { label: 'Max displacement', value: `${max_distortion_px.toFixed(2)} px` },
          ].map(r => (
            <Box key={r.label} sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">{r.label}: </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{r.value}</Typography>
            </Box>
          ))}
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              Distortion vector [k1, k2, p1, p2, k3]:
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: 'block', fontFamily: 'monospace', mt: 0.3 }}
            >
              [{distortion.distortion_vector.map(v => v.toFixed(6)).join(', ')}]
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Box>
  )
}

export default DistortionPanel
