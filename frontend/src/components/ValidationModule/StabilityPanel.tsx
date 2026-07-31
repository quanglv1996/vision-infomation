import React from 'react'
import { Box, Chip, Grid, Stack, Typography } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { ValidationResult } from '@/types/validation'

interface Props { result: ValidationResult }

const StabilityPanel: React.FC<Props> = ({ result: { stability: stb } }) => {
  if (!stb) return <Box sx={{ p: 3 }}><Typography color="text.secondary">No stability data.</Typography></Box>

  const sc = stb.pass_rate_pct >= 99.9 ? '#10B981' : stb.pass_rate_pct >= 99 ? '#3B82F6' : stb.pass_rate_pct >= 95 ? '#F59E0B' : '#EF4444'
  const trendData = stb.trend.map((v, i) => ({ run: i, passRate: v }))

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Stability Test ({stb.n_runs.toLocaleString()} runs)
        </Typography>
        <Chip label={`${stb.pass_rate_pct.toFixed(3)}% pass`} size="small"
          sx={{ bgcolor: sc + '22', color: sc, fontWeight: 700 }} />
      </Stack>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: 'Total Runs',    value: stb.n_runs.toLocaleString() },
          { label: 'Pass',          value: stb.pass_count.toLocaleString(), color: '#10B981' },
          { label: 'Fail',          value: stb.fail_count.toLocaleString(), color: stb.fail_count > 0 ? '#EF4444' : '#10B981' },
          { label: 'Pass Rate',     value: `${stb.pass_rate_pct.toFixed(3)} %`, color: sc },
          { label: 'Failure Rate',  value: `${stb.failure_rate_pct.toFixed(4)} %` },
          { label: 'First Failure', value: stb.first_failure_at != null ? `#${stb.first_failure_at}` : '—' },
          { label: 'Max Consec. Fail', value: stb.max_consecutive_failures.toString() },
        ].map(m => (
          <Grid item xs={6} sm key={m.label}>
            <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">{m.label}</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: (m as {color?:string}).color ?? 'text.primary' }}>{m.value}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Typography variant="body2" color="text.secondary" gutterBottom>Rolling Pass Rate Trend</Typography>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="run" tick={{ fontSize: 9, fill: '#6B7280' }} />
          <YAxis domain={[Math.min(90, stb.pass_rate_pct - 2), 101]} tick={{ fontSize: 9, fill: '#9CA3AF' }} unit="%" />
          <Tooltip contentStyle={{ background: '#1e2329', border: '1px solid #374151', fontSize: '0.72rem' }}
            formatter={(v: number) => [`${v.toFixed(2)}%`, 'Pass Rate']} />
          <ReferenceLine y={99}   stroke="#10B981" strokeDasharray="4 2" label={{ value: '99%', fill: '#10B981', fontSize: 9 }} />
          <ReferenceLine y={95}   stroke="#F59E0B" strokeDasharray="4 2" label={{ value: '95%', fill: '#F59E0B', fontSize: 9 }} />
          <Line type="monotone" dataKey="passRate" stroke={sc} dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default StabilityPanel
