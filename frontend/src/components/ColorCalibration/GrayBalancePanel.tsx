import React from 'react'
import { Box, Chip, Grid, Stack, Typography } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { ColorCalibrationResult } from '@/types/colorCalibration'

interface Props { result: ColorCalibrationResult }

const GrayBalancePanel: React.FC<Props> = ({ result: { gray_balance: gb } }) => {
  const errColor = gb.neutrality_error_pct < 2 ? '#10B981' : gb.neutrality_error_pct < 5 ? '#F59E0B' : '#EF4444'
  const chartData = [
    { ch: 'R', deviation: parseFloat(gb.r_deviation_pct.toFixed(2)), fill: '#EF4444' },
    { ch: 'G', deviation: parseFloat(gb.g_deviation_pct.toFixed(2)), fill: '#10B981' },
    { ch: 'B', deviation: parseFloat(gb.b_deviation_pct.toFixed(2)), fill: '#3B82F6' },
  ]

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">Gray Balance &amp; Neutrality</Typography>
        <Chip
          label={gb.status.toUpperCase()}
          size="small"
          sx={{ bgcolor: errColor + '22', color: errColor, fontWeight: 700 }}
        />
      </Stack>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: 'Neutrality Error', value: `${gb.neutrality_error_pct.toFixed(2)} %`, color: errColor },
          { label: 'R Deviation',      value: `${gb.r_deviation_pct > 0 ? '+' : ''}${gb.r_deviation_pct.toFixed(2)} %`, color: '#EF4444' },
          { label: 'G Deviation',      value: `${gb.g_deviation_pct > 0 ? '+' : ''}${gb.g_deviation_pct.toFixed(2)} %`, color: '#10B981' },
          { label: 'B Deviation',      value: `${gb.b_deviation_pct > 0 ? '+' : ''}${gb.b_deviation_pct.toFixed(2)} %`, color: '#3B82F6' },
          { label: 'Gray Line Slope',  value: gb.gray_line_slope.toFixed(4), color: '#9CA3AF' },
        ].map(m => (
          <Grid item xs={6} sm={2.4} key={m.label}>
            <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">{m.label}</Typography>
              <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700, color: m.color }}>{m.value}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Typography variant="body2" color="text.secondary" gutterBottom>Channel Deviation from Neutral (%)</Typography>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="ch" tick={{ fill: '#9CA3AF', fontSize: 13 }} />
          <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} unit="%" />
          <Tooltip
            contentStyle={{ background: '#1e2329', border: '1px solid #374151', fontSize: '0.75rem' }}
            formatter={(v: number) => [`${v.toFixed(3)} %`, 'Deviation']}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" />
          <ReferenceLine y={2}   stroke="#10B981" strokeDasharray="4 2" label={{ value: '+2%', fill: '#10B981', fontSize: 10 }} />
          <ReferenceLine y={-2}  stroke="#10B981" strokeDasharray="4 2" />
          <Bar dataKey="deviation" radius={[3, 3, 0, 0]}
            fill="#9CA3AF"
            cell={chartData.map(d => (
              <rect key={d.ch} fill={d.fill} />
            )) as unknown as React.ReactElement}
          />
        </BarChart>
      </ResponsiveContainer>
      <Typography variant="caption" color="text.disabled">
        Ideal: all bars at 0% (perfectly neutral). Slope {gb.gray_line_slope.toFixed(4)} (ideal = 1.0).
      </Typography>
    </Box>
  )
}

export default GrayBalancePanel
