import React from 'react'
import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { ValidationResult } from '@/types/validation'

interface Props { result: ValidationResult }

const RepeatabilityPanel: React.FC<Props> = ({ result: { repeatability: rep } }) => {
  if (!rep) return <Box sx={{ p: 3 }}><Typography color="text.secondary">No repeatability data.</Typography></Box>

  const cpkColor = !rep.cpk ? '#9CA3AF' : rep.cpk >= 1.33 ? '#10B981' : rep.cpk >= 1.0 ? '#F59E0B' : '#EF4444'
  const histData = rep.histogram.map((v, i) => ({
    bin: rep.histogram_edges[i]?.toFixed(3) ?? '', count: v,
  }))

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">Repeatability &amp; Process Capability</Typography>
        <Chip label={rep.status} size="small"
          sx={{ bgcolor: cpkColor + '22', color: cpkColor, fontWeight: 700 }} />
      </Stack>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: 'n',    value: rep.n.toString() },
          { label: 'Mean', value: rep.mean.toFixed(6) },
          { label: 'Std',  value: rep.std.toFixed(6) },
          { label: 'Min',  value: rep.min_val.toFixed(4) },
          { label: 'Max',  value: rep.max_val.toFixed(4) },
          { label: 'Range',value: rep.range_val.toFixed(4) },
          { label: 'CV %', value: rep.cv_pct.toFixed(3) + ' %' },
          { label: 'USL',  value: rep.usl != null ? rep.usl.toString() : '—' },
          { label: 'LSL',  value: rep.lsl != null ? rep.lsl.toString() : '—' },
          { label: 'Cp',   value: rep.cp != null ? rep.cp.toFixed(4) : '—' },
          { label: 'Cpk',  value: rep.cpk != null ? rep.cpk.toFixed(4) : '—', color: cpkColor },
        ].map(m => (
          <Grid item xs={4} sm key={m.label}>
            <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">{m.label}</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 700, color: (m as { color?: string }).color ?? 'text.primary' }}>{m.value}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Cpk gauge bar */}
      {rep.cpk != null && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>Process Capability Index (Cpk)</Typography>
          <Box sx={{ position: 'relative', height: 20, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 1, overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${Math.min(100, rep.cpk / 2.0 * 100)}%`, bgcolor: cpkColor, borderRadius: 1, transition: 'width 0.5s' }} />
            {[{ v: 1.0, label: '1.0' }, { v: 1.33, label: '1.33' }, { v: 1.67, label: '1.67' }].map(r => (
              <Box key={r.label} sx={{ position: 'absolute', left: `${r.v / 2.0 * 100}%`, top: 0, bottom: 0, width: 1, bgcolor: 'rgba(255,255,255,0.4)' }} />
            ))}
          </Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.disabled">0</Typography>
            <Typography variant="caption" color="#F59E0B">1.0 (min)</Typography>
            <Typography variant="caption" color="#10B981">1.33 (good)</Typography>
            <Typography variant="caption" color="text.disabled">2.0</Typography>
          </Stack>
        </Box>
      )}

      <Typography variant="body2" color="text.secondary" gutterBottom>Measurement Distribution</Typography>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={histData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="bin" tick={{ fontSize: 9, fill: '#6B7280' }} interval={3} />
          <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} />
          <Tooltip contentStyle={{ background: '#1e2329', border: '1px solid #374151', fontSize: '0.72rem' }} />
          {rep.usl != null && <ReferenceLine x={rep.usl.toFixed(3)} stroke="#EF4444" strokeDasharray="4 2" />}
          {rep.lsl != null && <ReferenceLine x={rep.lsl.toFixed(3)} stroke="#EF4444" strokeDasharray="4 2" />}
          <Bar dataKey="count" fill="#3B82F6" radius={[2,2,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default RepeatabilityPanel
