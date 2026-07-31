import React from 'react'
import { Box, Chip, Grid, Stack, Typography } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { ValidationResult } from '@/types/validation'

interface Props { result: ValidationResult }

const RuntimePanel: React.FC<Props> = ({ result: { runtime: rt } }) => {
  if (!rt) return <Box sx={{ p: 3 }}><Typography color="text.secondary">No runtime benchmark data.</Typography></Box>

  const sc = rt.status === 'excellent' ? '#10B981' : rt.status === 'good' ? '#3B82F6' : rt.status === 'marginal' ? '#F59E0B' : '#EF4444'
  const histData = rt.histogram.map((v, i) => ({ bin: rt.histogram_edges[i]?.toFixed(1) ?? '', count: v }))
  const targetMs = rt.target_fps ? 1000 / rt.target_fps : null

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Runtime Benchmark ({rt.n_samples} samples)
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <Chip label={`${rt.fps.toFixed(1)} FPS`} size="small" sx={{ bgcolor: sc + '22', color: sc, fontWeight: 700 }} />
          {rt.target_fps && <Chip label={`Target: ${rt.target_fps} FPS`} size="small" variant="outlined" />}
        </Stack>
      </Stack>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: 'Mean',   value: `${rt.mean_ms.toFixed(2)} ms` },
          { label: 'Std',    value: `${rt.std_ms.toFixed(2)} ms` },
          { label: 'Min',    value: `${rt.min_ms.toFixed(2)} ms` },
          { label: 'Max',    value: `${rt.max_ms.toFixed(2)} ms` },
          { label: 'P50',    value: `${rt.p50_ms.toFixed(2)} ms` },
          { label: 'P95',    value: `${rt.p95_ms.toFixed(2)} ms` },
          { label: 'P99',    value: `${rt.p99_ms.toFixed(2)} ms` },
          { label: 'FPS',    value: rt.fps.toFixed(1), color: sc },
        ].map(m => (
          <Grid item xs={3} sm key={m.label}>
            <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">{m.label}</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 700, color: (m as {color?:string}).color ?? 'text.primary' }}>{m.value}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Typography variant="body2" color="text.secondary" gutterBottom>Latency Distribution (ms)</Typography>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={histData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="bin" tick={{ fontSize: 9, fill: '#6B7280' }} interval={3} />
          <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} />
          <Tooltip contentStyle={{ background: '#1e2329', border: '1px solid #374151', fontSize: '0.72rem' }} />
          {targetMs && <ReferenceLine x={targetMs.toFixed(1)} stroke="#EF4444" strokeDasharray="4 2" label={{ value: 'Target', fill: '#EF4444', fontSize: 9 }} />}
          <Bar dataKey="count" fill="#F59E0B" radius={[2,2,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default RuntimePanel
