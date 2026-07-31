import React from 'react'
import { Box, Card, CardContent, Chip, Grid, LinearProgress, Stack, Typography } from '@mui/material'
import type { ColorCalibrationResult } from '@/types/colorCalibration'

interface Props { result: ColorCalibrationResult }

const cctLabel = (k: number) =>
  k < 3300 ? 'Warm (tungsten)' : k < 4500 ? 'Warm-white' : k < 5500 ? 'Neutral' : k < 6800 ? 'Daylight' : 'Cool (blue)'

const WhiteBalancePanel: React.FC<Props> = ({ result: { white_balance: wb } }) => {
  const { r_gain, b_gain, mean_r, mean_g, mean_b, color_temperature_k, tint, wb_score, status } = wb
  const scoreColor = wb_score > 85 ? '#10B981' : wb_score > 65 ? '#F59E0B' : '#EF4444'

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">White Balance Analysis</Typography>
        <Stack direction="row" spacing={1}>
          <Chip label={`Score: ${wb_score.toFixed(0)}/100`} size="small"
            sx={{ bgcolor: scoreColor + '22', color: scoreColor, fontWeight: 700 }} />
          <Chip label={status} size="small" variant="outlined" />
        </Stack>
      </Stack>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: 'R Gain (correction)', value: r_gain.toFixed(4), color: '#EF4444', highlight: Math.abs(r_gain - 1) > 0.1 },
          { label: 'G Gain (reference)',  value: '1.0000',          color: '#10B981', highlight: false },
          { label: 'B Gain (correction)', value: b_gain.toFixed(4), color: '#3B82F6', highlight: Math.abs(b_gain - 1) > 0.1 },
        ].map(g => (
          <Grid item xs={4} key={g.label}>
            <Card variant="outlined" sx={{ bgcolor: g.highlight ? g.color + '11' : 'rgba(255,255,255,0.03)', borderColor: g.highlight ? g.color + '55' : 'divider' }}>
              <CardContent sx={{ p: '10px 14px !important', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">{g.label}</Typography>
                <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 800, color: g.color }}>{g.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Channel means bar */}
      <Typography variant="body2" color="text.secondary" gutterBottom>Channel Mean Values</Typography>
      <Box sx={{ mb: 2 }}>
        {[
          { label: 'Red',   value: mean_r, color: '#EF4444' },
          { label: 'Green', value: mean_g, color: '#10B981' },
          { label: 'Blue',  value: mean_b, color: '#3B82F6' },
        ].map(ch => (
          <Stack key={ch.label} direction="row" alignItems="center" spacing={1} sx={{ mb: 0.8 }}>
            <Typography variant="caption" sx={{ minWidth: 40, color: ch.color }}>{ch.label}</Typography>
            <Box sx={{ flex: 1, height: 12, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 1, overflow: 'hidden' }}>
              <Box sx={{ height: '100%', width: `${ch.value / 255 * 100}%`, bgcolor: ch.color, borderRadius: 1, transition: 'width 0.5s' }} />
            </Box>
            <Typography variant="caption" sx={{ minWidth: 36, fontFamily: 'monospace', color: ch.color }}>
              {ch.value.toFixed(1)}
            </Typography>
          </Stack>
        ))}
      </Box>

      {/* Color temperature */}
      <Grid container spacing={1.5}>
        {[
          { label: 'Color Temperature', value: `${color_temperature_k.toFixed(0)} K`, sub: cctLabel(color_temperature_k) },
          { label: 'Tint',              value: `${tint > 0 ? '+' : ''}${tint.toFixed(1)}`, sub: tint < -15 ? 'Green shift' : tint > 15 ? 'Magenta shift' : 'Neutral' },
          { label: 'WB Score',          value: `${wb_score.toFixed(1)} / 100`, sub: status },
        ].map(m => (
          <Grid item xs={12} sm={4} key={m.label}>
            <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)' }}>
              <Typography variant="caption" color="text.secondary" display="block">{m.label}</Typography>
              <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{m.value}</Typography>
              <Typography variant="caption" color="text.disabled">{m.sub}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default WhiteBalancePanel
