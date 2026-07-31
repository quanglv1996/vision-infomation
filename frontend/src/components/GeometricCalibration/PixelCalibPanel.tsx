import React from 'react'
import { Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material'
import type { GeometricCalibrationResult } from '@/types/geometricCalibration'

interface Props { result: GeometricCalibrationResult }

const BigVal = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
    <CardContent sx={{ p: '16px !important' }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#3B82F6', my: 0.5 }}>
        {value}
      </Typography>
      {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
    </CardContent>
  </Card>
)

const PixelCalibPanel: React.FC<Props> = ({ result: { pixel_calib, working_distance, intrinsic, image_width, image_height } }) => {
  if (!pixel_calib) {
    return <Box sx={{ p: 3 }}><Typography color="text.secondary">Pixel calibration not available.</Typography></Box>
  }
  const { mm_per_pixel, pixel_per_mm, fov_width_mm, fov_height_mm, measurement_accuracy_pct } = pixel_calib

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Pixel Size Calibration
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <BigVal label="mm / pixel" value={mm_per_pixel.toFixed(5)} sub="spatial resolution" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <BigVal label="pixel / mm" value={pixel_per_mm.toFixed(3)} sub="linear density" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <BigVal label="FOV Width"  value={`${fov_width_mm.toFixed(1)} mm`}  sub={`${image_width} px`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <BigVal label="FOV Height" value={`${fov_height_mm.toFixed(1)} mm`} sub={`${image_height} px`} />
        </Grid>
      </Grid>

      {/* Measurement accuracy */}
      <Card variant="outlined" sx={{ bgcolor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.3)', mb: 3 }}>
        <CardContent sx={{ p: '12px 16px !important' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box>
              <Typography variant="caption" color="text.secondary">Estimated Measurement Accuracy</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#10B981' }}>
                ±{(measurement_accuracy_pct * mm_per_pixel).toFixed(4)} mm
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Sub-pixel accuracy</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', color: '#10B981' }}>
                ±0.1 px = {(0.1 * mm_per_pixel).toFixed(4)} mm
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Working distance */}
      {working_distance && (
        <>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Working Distance Estimation</Typography>
          <Grid container spacing={1.5}>
            {[
              { label: 'Estimated WD', value: `${working_distance.estimated_wd_mm.toFixed(1)} mm` },
              { label: 'FOV Width (at WD)', value: `${working_distance.fov_width_mm.toFixed(1)} mm` },
              { label: 'FOV Height (at WD)', value: `${working_distance.fov_height_mm.toFixed(1)} mm` },
              { label: 'Scale Error (fx vs fy)', value: `${working_distance.scale_error_pct.toFixed(3)} %` },
            ].map(s => (
              <Grid item xs={6} sm={3} key={s.label}>
                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)' }}>
                  <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{s.value}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  )
}

export default PixelCalibPanel
