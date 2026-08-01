import React, { useState } from 'react'
import { Box, Chip, Stack, Tab, Tabs, Typography } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'
import type { ComparisonResult } from '@/types/imageComparison'

interface Props { result: ComparisonResult; colors: string[] }

type MetricGroup = 'sharpness' | 'brightness' | 'contrast' | 'noise' | 'advanced'

const MetricsCharts: React.FC<Props> = ({ result, colors }) => {
  const [group, setGroup] = useState<MetricGroup>('sharpness')
  const m = result.metrics

  const barGroups: Record<MetricGroup, { key: string; label: string }[]> = {
    sharpness: [
      { key: 'laplacian_variance', label: 'Laplacian Var.' },
      { key: 'tenengrad',          label: 'Tenengrad' },
      { key: 'brenner',            label: 'Brenner' },
      { key: 'edge_density',       label: 'Edge Density (×1000)' },
    ],
    brightness: [
      { key: 'mean_brightness',    label: 'Mean Brightness %' },
      { key: 'std_brightness',     label: 'Std Brightness %' },
      { key: 'dynamic_range_pct',  label: 'Dynamic Range %' },
    ],
    contrast: [
      { key: 'michelson',          label: 'Michelson (×100)' },
      { key: 'rms_contrast',       label: 'RMS Contrast (×100)' },
      { key: 'local_contrast',     label: 'Local Contrast (×100)' },
    ],
    noise: [
      { key: 'noise_std',          label: 'Noise σ % (lower=better)' },
      { key: 'snr_db',             label: 'SNR (dB)' },
    ],
    advanced: [
      { key: 'entropy',            label: 'Entropy' },
      { key: 'fft_sharpness',      label: 'FFT Sharpness (×100)' },
    ],
  }

  const MULT: Record<string, number> = {
    edge_density: 1000, michelson: 100, rms_contrast: 100, local_contrast: 100, fft_sharpness: 100,
  }

  const chartData = barGroups[group].map(({ key, label }) => {
    const entry: Record<string, unknown> = { metric: label }
    m.forEach((img, i) => {
      const mult = MULT[key] ?? 1
      entry[img.name] = parseFloat(((img as unknown as Record<string, number>)[key] * mult).toFixed(3))
    })
    return entry
  })

  // Radar data — normalized 0-100 scores per image
  const radarData = [
    { subject: 'Sharpness',  ...Object.fromEntries(m.map(x => [x.name, x.sharpness_score])) },
    { subject: 'Brightness', ...Object.fromEntries(m.map(x => [x.name, x.brightness_score])) },
    { subject: 'Contrast',   ...Object.fromEntries(m.map(x => [x.name, x.contrast_score])) },
    { subject: 'Noise',      ...Object.fromEntries(m.map(x => [x.name, x.noise_score])) },
    { subject: 'Entropy',    ...Object.fromEntries(m.map(x => [x.name, Math.min(100, x.entropy / 8 * 100)])) },
    { subject: 'Overall',    ...Object.fromEntries(m.map(x => [x.name, x.overall_score])) },
  ]

  return (
    <Box sx={{ p: 2 }}>
      {/* Ranking chips */}
      <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 2 }}>
        {result.overall_ranking.map((idx, pos) => (
          <Chip
            key={idx}
            label={`#${pos+1} ${m[idx].name} (${m[idx].overall_score.toFixed(0)})`}
            size="small"
            sx={{ bgcolor: colors[idx % colors.length] + '22', color: colors[idx % colors.length], fontWeight: pos === 0 ? 800 : 500 }}
          />
        ))}
      </Stack>

      {/* Radar chart */}
      <Typography variant="body2" color="text.secondary" gutterBottom>Multi-Metric Radar</Typography>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 9 }} tickCount={4} />
          {m.map((img, i) => (
            <Radar
              key={img.index} name={img.name} dataKey={img.name}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]} fillOpacity={0.12}
              dot={{ r: 3 }}
            />
          ))}
          <Legend iconSize={10} wrapperStyle={{ fontSize: '0.72rem' }} />
          <Tooltip contentStyle={{ background: '#1e2329', border: '1px solid #374151', fontSize: '0.72rem' }} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Metric group bar charts */}
      <Tabs
        value={group} onChange={(_, v) => setGroup(v)}
        sx={{ mb: 1, minHeight: 32, '& .MuiTab-root': { minHeight: 32, fontSize: '0.72rem', py: 0.3 } }}
      >
        {(['sharpness','brightness','contrast','noise','advanced'] as MetricGroup[]).map(g => (
          <Tab key={g} value={g} label={g.charAt(0).toUpperCase()+g.slice(1)} />
        ))}
      </Tabs>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="metric" tick={{ fontSize: 9, fill: '#6B7280' }} angle={-25} textAnchor="end" />
          <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} />
          <Tooltip contentStyle={{ background: '#1e2329', border: '1px solid #374151', fontSize: '0.72rem' }} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: '0.72rem' }} />
          {m.map((img, i) => (
            <Bar key={img.index} dataKey={img.name} fill={colors[i % colors.length]} radius={[3,3,0,0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default MetricsCharts
