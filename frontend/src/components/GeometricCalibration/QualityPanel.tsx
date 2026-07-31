import React from 'react'
import { Box, Card, CardContent, Chip, CircularProgress, Grid, Stack, Typography } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { GeometricCalibrationResult } from '@/types/geometricCalibration'

interface Props { result: GeometricCalibrationResult }

const STATUS_COLOR: Record<string, string> = {
  excellent:  '#10B981',
  good:       '#3B82F6',
  acceptable: '#F59E0B',
  poor:       '#EF4444',
}

const QualityPanel: React.FC<Props> = ({ result: { quality, num_images_used } }) => {
  const { rms_error, mean_error, max_error, per_image_errors, calibration_score, status } = quality
  const color = STATUS_COLOR[status] ?? '#9CA3AF'

  const chartData = per_image_errors.map((e, i) => ({ img: `#${i}`, error: e }))

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Score gauge */}
        <Grid item xs={12} sm="auto">
          <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.03)', minWidth: 160 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                <CircularProgress
                  variant="determinate" value={calibration_score}
                  size={100} thickness={5}
                  sx={{ color, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
                />
                <CircularProgress
                  variant="determinate" value={100}
                  size={100} thickness={5}
                  sx={{ color: 'rgba(255,255,255,0.08)', position: 'absolute', left: 0 }}
                />
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color }}>{calibration_score.toFixed(0)}</Typography>
                  <Typography variant="caption" color="text.secondary">/ 100</Typography>
                </Box>
              </Box>
              <Chip label={status.toUpperCase()} size="small" sx={{ bgcolor: color + '22', color, fontWeight: 700 }} />
              <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                {num_images_used} images used
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Error metrics */}
        {[
          { label: 'RMS Reprojection Error', value: rms_error,  unit: 'px', good: 0.3,  warn: 1.0 },
          { label: 'Mean Error',             value: mean_error, unit: 'px', good: 0.3,  warn: 1.0 },
          { label: 'Max Error',              value: max_error,  unit: 'px', good: 1.0,  warn: 3.0 },
        ].map(m => {
          const c = m.value < m.good ? '#10B981' : m.value < m.warn ? '#F59E0B' : '#EF4444'
          return (
            <Grid item xs={12} sm key={m.label}>
              <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.03)', height: '100%' }}>
                <CardContent sx={{ p: '14px 16px !important' }}>
                  <Typography variant="caption" color="text.secondary">{m.label}</Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 800, color: c, mt: 0.5 }}>
                    {m.value.toFixed(4)}
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>{m.unit}</Typography>
                  </Typography>
                  <Typography variant="caption" sx={{ color: c }}>
                    {m.value < m.good ? '✓ Excellent' : m.value < m.warn ? '⚠ Acceptable' : '✗ High — recalibrate'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Per-image bar chart */}
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Per-Image Reprojection Error
      </Typography>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="img" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
          <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} unit=" px" />
          <Tooltip
            contentStyle={{ background: '#1e2329', border: '1px solid #374151', fontSize: '0.75rem' }}
            formatter={(v: number) => [`${v.toFixed(4)} px`, 'Error']}
          />
          <ReferenceLine y={0.3} stroke="#10B981" strokeDasharray="4 2" label={{ value: 'Excellent', fill: '#10B981', fontSize: 10 }} />
          <ReferenceLine y={1.0} stroke="#EF4444" strokeDasharray="4 2" label={{ value: 'Poor', fill: '#EF4444', fontSize: 10 }} />
          <Bar dataKey="error" fill={color} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default QualityPanel
