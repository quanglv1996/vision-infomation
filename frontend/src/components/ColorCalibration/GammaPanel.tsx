import React from 'react'
import { Box, Chip, Grid, Stack, Typography } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { ColorCalibrationResult } from '@/types/colorCalibration'

interface Props { result: ColorCalibrationResult }

const GammaPanel: React.FC<Props> = ({ result: { gamma } }) => {
  const { estimated_gamma, recommended_gamma, response_x, response_y, ideal_y, linearity_error_pct } = gamma

  const chartData = response_x.map((x, i) => ({
    input:    Math.round(x * 255),
    measured: parseFloat((response_y[i] * 255).toFixed(1)),
    ideal:    parseFloat((ideal_y[i] * 255).toFixed(1)),
    linear:   parseFloat((x * 255).toFixed(1)),
  }))

  const diff = Math.abs(estimated_gamma - recommended_gamma)
  const color = diff < 0.15 ? '#10B981' : diff < 0.4 ? '#F59E0B' : '#EF4444'

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">Gamma Analysis</Typography>
        <Chip
          label={diff < 0.15 ? 'Good' : diff < 0.4 ? 'Acceptable' : 'Needs Correction'}
          size="small"
          sx={{ bgcolor: color + '22', color, fontWeight: 700 }}
        />
      </Stack>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: 'Estimated Gamma',    value: estimated_gamma.toFixed(3),    color },
          { label: 'Recommended Gamma',  value: recommended_gamma.toFixed(1),  color: '#9CA3AF' },
          { label: 'Linearity Error',    value: `${linearity_error_pct.toFixed(2)} %`, color: diff < 0.15 ? '#10B981' : '#F59E0B' },
        ].map(m => (
          <Grid item xs={12} sm={4} key={m.label}>
            <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">{m.label}</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 800, color: m.color }}>{m.value}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Typography variant="body2" color="text.secondary" gutterBottom>Gamma Response Curve</Typography>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="input" tick={{ fontSize: 10, fill: '#9CA3AF' }} label={{ value: 'Input', position: 'insideBottomRight', fill: '#9CA3AF', fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} label={{ value: 'Output', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 10 }} />
          <Tooltip contentStyle={{ background: '#1e2329', border: '1px solid #374151', fontSize: '0.75rem' }} />
          <Legend iconType="line" iconSize={12} wrapperStyle={{ fontSize: '0.75rem' }} />
          <Line type="monotone" dataKey="linear"   stroke="rgba(255,255,255,0.2)" strokeDasharray="4 2" dot={false} name="Linear (γ=1.0)" />
          <Line type="monotone" dataKey="ideal"    stroke="#10B981"               strokeDasharray="4 2" dot={false} name={`sRGB (γ=${recommended_gamma})`} strokeWidth={1.5} />
          <Line type="monotone" dataKey="measured" stroke="#F59E0B"               dot={{ r: 3 }}        name={`Estimated (γ=${estimated_gamma.toFixed(2)})`} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default GammaPanel
