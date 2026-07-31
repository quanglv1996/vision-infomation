import React, { useState } from 'react'
import {
  Box, Chip, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from '@mui/material'
import type { GeometricCalibrationResult } from '@/types/geometricCalibration'

interface Props { result: GeometricCalibrationResult }

const badge = (v: number, good: number, warn: number) => {
  const color = Math.abs(v) < good ? '#10B981' : Math.abs(v) < warn ? '#F59E0B' : '#EF4444'
  return <Box component="span" sx={{ color, fontWeight: 600 }}>{v.toFixed(2)}</Box>
}

const PosePanel: React.FC<Props> = ({ result: { poses, num_images_used } }) => {
  const [sort, setSort] = useState<'image' | 'error'>('image')
  const sorted = [...poses].sort((a, b) =>
    sort === 'error' ? b.reprojection_error - a.reprojection_error : a.image_index - b.image_index
  )

  const avgTz  = poses.reduce((s, p) => s + p.tz_mm, 0) / Math.max(poses.length, 1)
  const avgErr = poses.reduce((s, p) => s + p.reprojection_error, 0) / Math.max(poses.length, 1)

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Camera Pose per Image ({num_images_used} images used)
        </Typography>
        <Stack direction="row" spacing={1}>
          {(['image', 'error'] as const).map(s => (
            <Chip
              key={s} size="small"
              label={s === 'image' ? 'Sort by Image' : 'Sort by Error'}
              variant={sort === s ? 'filled' : 'outlined'}
              onClick={() => setSort(s)}
              color={sort === s ? 'primary' : 'default'}
            />
          ))}
        </Stack>
      </Stack>

      {/* Summary */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        {[
          { label: 'Avg. working dist.', value: `${avgTz.toFixed(1)} mm` },
          { label: 'Avg. reproj. error',  value: `${avgErr.toFixed(3)} px` },
        ].map(s => (
          <Box key={s.label} sx={{ px: 2, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)' }}>
            <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{s.value}</Typography>
          </Box>
        ))}
      </Stack>

      <TableContainer sx={{ maxHeight: 400 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {['Img', 'Roll (°)', 'Pitch (°)', 'Yaw (°)', 'Tx (mm)', 'Ty (mm)', 'Tz (mm)', 'Reproj. err (px)'].map(h => (
                <TableCell key={h} sx={{ fontFamily: 'monospace', fontSize: '0.72rem', bgcolor: 'background.paper' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map(p => (
              <TableRow key={p.image_index} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{p.image_index}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{badge(p.roll_deg,  5, 15)}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{badge(p.pitch_deg, 5, 15)}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{badge(p.yaw_deg,   5, 15)}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{p.tx_mm.toFixed(1)}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{p.ty_mm.toFixed(1)}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{p.tz_mm.toFixed(1)}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>
                  <Box component="span" sx={{ color: p.reprojection_error < 0.5 ? '#10B981' : p.reprojection_error < 1.0 ? '#F59E0B' : '#EF4444', fontWeight: 600 }}>
                    {p.reprojection_error.toFixed(4)}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default PosePanel
