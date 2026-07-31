import React from 'react'
import { Box, Chip, Grid, Stack, Typography } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import type { ValidationResult } from '@/types/validation'

interface Props { result: ValidationResult }

const GRRPanel: React.FC<Props> = ({ result: { grr } }) => {
  if (!grr) return <Box sx={{ p: 3 }}><Typography color="text.secondary">No GR&amp;R data. Provide grr input to analyze.</Typography></Box>

  const sc = grr.grr_pct < 10 ? '#10B981' : grr.grr_pct < 30 ? '#F59E0B' : '#EF4444'
  const barData = [
    { name: 'EV (Repeatability)', value: parseFloat(grr.ev_pct.toFixed(2)), fill: '#3B82F6' },
    { name: 'AV (Reproducibility)', value: parseFloat(grr.av_pct.toFixed(2)), fill: '#8B5CF6' },
    { name: 'GR&R Total', value: parseFloat(grr.grr_pct.toFixed(2)), fill: sc },
    { name: 'PV (Part Variation)', value: parseFloat(grr.pv_pct.toFixed(2)), fill: '#9CA3AF' },
  ]

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Gauge R&amp;R — {grr.n_operators} operators × {grr.n_parts} parts × {grr.n_replicates} replicates
        </Typography>
        <Chip label={`GR&R: ${grr.grr_pct.toFixed(2)}% [${grr.status}]`} size="small"
          sx={{ bgcolor: sc + '22', color: sc, fontWeight: 700 }} />
      </Stack>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: 'EV % (Repeatability)',    value: `${grr.ev_pct.toFixed(3)} %`,  color: '#3B82F6' },
          { label: 'AV % (Reproducibility)',  value: `${grr.av_pct.toFixed(3)} %`,  color: '#8B5CF6' },
          { label: 'GR&R %',                  value: `${grr.grr_pct.toFixed(3)} %`, color: sc },
          { label: 'PV % (Parts)',             value: `${grr.pv_pct.toFixed(3)} %`,  color: '#9CA3AF' },
          { label: 'NDC',                      value: grr.ndc.toString(), color: grr.ndc >= 5 ? '#10B981' : '#F59E0B' },
        ].map(m => (
          <Grid item xs={6} sm key={m.label}>
            <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">{m.label}</Typography>
              <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700, color: m.color }}>{m.value}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* AIAG acceptance criteria */}
      <Box sx={{ p: 1.5, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(0,0,0,0.2)' }}>
        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
          AIAG criteria: GR&amp;R &lt;10% = acceptable · 10–30% = marginal · &gt;30% = unacceptable | NDC ≥ 5 required
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" gutterBottom>Variance Component Breakdown (%)</Typography>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 40, left: 120, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 9, fill: '#9CA3AF' }} unit="%" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} width={115} />
          <Tooltip contentStyle={{ background: '#1e2329', border: '1px solid #374151', fontSize: '0.72rem' }}
            formatter={(v: number) => [`${v.toFixed(3)} %`, '']} />
          <ReferenceLine x={10} stroke="#10B981" strokeDasharray="4 2" />
          <ReferenceLine x={30} stroke="#EF4444" strokeDasharray="4 2" />
          <Bar dataKey="value" radius={[0,3,3,0]}>
            {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default GRRPanel
