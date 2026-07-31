import React from 'react'
import { Box, Grid, Stack, Typography } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter, ZAxis,
} from 'recharts'
import type { ColorCalibrationResult } from '@/types/colorCalibration'

interface Props { result: ColorCalibrationResult }

const ColorSpacePanel: React.FC<Props> = ({ result: { color_space: cs } }) => {
  const histData = cs.histogram_bins.map((b, i) => ({
    bin: Math.round(b),
    R: cs.histogram_r[i] ?? 0,
    G: cs.histogram_g[i] ?? 0,
    B: cs.histogram_b[i] ?? 0,
  }))

  return (
    <Box sx={{ p: 2 }}>
      {/* RGB Histogram */}
      <Typography variant="body2" color="text.secondary" gutterBottom>RGB Histogram</Typography>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={histData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="0%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="bin" tick={{ fontSize: 9, fill: '#6B7280' }} interval={7} />
          <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} />
          <Tooltip contentStyle={{ background: '#1e2329', border: '1px solid #374151', fontSize: '0.72rem' }}
            formatter={(v: number, name: string) => [v.toFixed(0), name]} />
          <Bar dataKey="R" fill="rgba(239,68,68,0.5)"  stroke="rgba(239,68,68,0.8)"  strokeWidth={0} />
          <Bar dataKey="G" fill="rgba(16,185,129,0.5)" stroke="rgba(16,185,129,0.8)" strokeWidth={0} />
          <Bar dataKey="B" fill="rgba(59,130,246,0.5)" stroke="rgba(59,130,246,0.8)" strokeWidth={0} />
        </BarChart>
      </ResponsiveContainer>

      {/* LAB & XYZ stats */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary" gutterBottom>CIELAB Statistics</Typography>
          {[
            { label: 'L* (lightness)',  mean: cs.lab_l_mean, std: cs.lab_l_std, range: '0–100' },
            { label: 'a* (green↔red)', mean: cs.lab_a_mean, std: cs.lab_a_std, range: '-128–+127' },
            { label: 'b* (blue↔yellow)',mean: cs.lab_b_mean, std: cs.lab_b_std, range: '-128–+127' },
          ].map(s => (
            <Stack key={s.label} direction="row" justifyContent="space-between" sx={{ mb: 0.5, px: 1, py: 0.4, border: '1px solid', borderColor: 'divider', borderRadius: 0.5 }}>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                {s.mean.toFixed(2)} ± {s.std.toFixed(2)}
              </Typography>
            </Stack>
          ))}
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary" gutterBottom>HSV &amp; XYZ</Typography>
          {[
            { label: 'Hue (mean)',        value: `${cs.hsv_hue_mean.toFixed(1)}°` },
            { label: 'Saturation (mean)', value: `${cs.hsv_sat_mean.toFixed(1)} %` },
            { label: 'Value (mean)',       value: `${cs.hsv_val_mean.toFixed(1)} %` },
            { label: 'XYZ  X / Y / Z',   value: `${cs.xyz_X.toFixed(4)} / ${cs.xyz_Y.toFixed(4)} / ${cs.xyz_Z.toFixed(4)}` },
          ].map(s => (
            <Stack key={s.label} direction="row" justifyContent="space-between" sx={{ mb: 0.5, px: 1, py: 0.4, border: '1px solid', borderColor: 'divider', borderRadius: 0.5 }}>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{s.value}</Typography>
            </Stack>
          ))}
        </Grid>
      </Grid>
    </Box>
  )
}

export default ColorSpacePanel
