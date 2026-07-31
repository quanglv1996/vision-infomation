import React, { useState } from 'react'
import {
  Box, Chip, Grid, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { ColorCalibrationResult } from '@/types/colorCalibration'

interface Props { result: ColorCalibrationResult }

const STATUS_COLOR = { pass: '#10B981', warning: '#F59E0B', fail: '#EF4444' }

const Swatch = ({ rgb }: { rgb: number[] }) => (
  <Box sx={{ width: 20, height: 20, borderRadius: 0.5, border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0,
    bgcolor: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` }} />
)

const ColorCheckerPanel: React.FC<Props> = ({ result: { color_checker: cc } }) => {
  const [metric, setMetric] = useState<'de76' | 'de94' | 'de2000'>('de2000')

  if (!cc) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">
          ColorChecker analysis is only available when image_type = "colorchecker".
        </Typography>
      </Box>
    )
  }

  const deKey = { de76: 'delta_e_76', de94: 'delta_e_94', de2000: 'delta_e_2000' } as const
  const chartData = cc.patches.map(p => ({
    name: p.name.split(' ')[0],
    de:   parseFloat(p[deKey[metric]].toFixed(2)),
    fill: STATUS_COLOR[p.status],
  }))

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">
          ColorChecker Analysis — {cc.detection_method === 'grid' ? 'Grid sampling' : 'Auto-detected'}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <Chip label={`${cc.pass_count} pass`} size="small" sx={{ bgcolor: '#10B98122', color: '#10B981' }} />
          <Chip label={`${cc.warning_count} warn`} size="small" sx={{ bgcolor: '#F59E0B22', color: '#F59E0B' }} />
          <Chip label={`${cc.fail_count} fail`} size="small" sx={{ bgcolor: '#EF444422', color: '#EF4444' }} />
        </Stack>
      </Stack>

      {/* Summary */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: 'Accuracy Score', value: `${cc.accuracy_score.toFixed(1)} / 100` },
          { label: 'Mean ΔE2000',    value: cc.mean_delta_e_2000.toFixed(3) },
          { label: 'Max ΔE2000',     value: cc.max_delta_e_2000.toFixed(3) },
          { label: 'Mean ΔE76',      value: cc.mean_delta_e_76.toFixed(3) },
          { label: 'Mean ΔE94',      value: cc.mean_delta_e_94.toFixed(3) },
        ].map(m => (
          <Grid item xs={6} sm key={m.label}>
            <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">{m.label}</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{m.value}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* ΔE bar chart */}
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">ΔE per patch —</Typography>
        {(['de76', 'de94', 'de2000'] as const).map(m => (
          <Chip key={m} label={m.toUpperCase()} size="small"
            variant={metric === m ? 'filled' : 'outlined'}
            onClick={() => setMetric(m)}
            color={metric === m ? 'primary' : 'default'}
            sx={{ fontSize: '0.65rem', height: 20 }}
          />
        ))}
      </Stack>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#6B7280' }} />
          <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} />
          <RTooltip contentStyle={{ background: '#1e2329', border: '1px solid #374151', fontSize: '0.72rem' }}
            formatter={(v: number) => [`${v.toFixed(3)}`, metric.toUpperCase()]} />
          <ReferenceLine y={3} stroke="#F59E0B" strokeDasharray="3 2" />
          <ReferenceLine y={6} stroke="#EF4444" strokeDasharray="3 2" />
          <Bar dataKey="de" radius={[2,2,0,0]}>
            {chartData.map((d, i) => (
              <rect key={i} fill={d.fill} />
            )) as unknown as React.ReactElement}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Patch table */}
      <TableContainer sx={{ maxHeight: 260, mt: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {['#', 'Name', 'Measured', 'Reference', 'ΔE76', 'ΔE94', 'ΔE2000', 'Status'].map(h => (
                <TableCell key={h} sx={{ fontFamily: 'monospace', fontSize: '0.7rem', bgcolor: 'background.paper', py: 0.5 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {cc.patches.map(p => {
              const sc = STATUS_COLOR[p.status] ?? '#9CA3AF'
              return (
                <TableRow key={p.patch_id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{p.patch_id}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>{p.name}</TableCell>
                  <TableCell><Stack direction="row" spacing={0.5} alignItems="center">
                    <Swatch rgb={p.measured_rgb} />
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>
                      {p.measured_rgb.map(v => Math.round(v)).join(',')}
                    </Typography>
                  </Stack></TableCell>
                  <TableCell><Stack direction="row" spacing={0.5} alignItems="center">
                    <Swatch rgb={p.reference_rgb} />
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>
                      {p.reference_rgb.join(',')}
                    </Typography>
                  </Stack></TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{p.delta_e_76.toFixed(2)}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{p.delta_e_94.toFixed(2)}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: sc, fontWeight: 600 }}>{p.delta_e_2000.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip label={p.status} size="small" sx={{ fontSize: '0.6rem', height: 16, bgcolor: sc + '22', color: sc }} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default ColorCheckerPanel
