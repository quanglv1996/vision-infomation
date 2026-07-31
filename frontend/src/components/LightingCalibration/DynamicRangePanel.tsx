import React from 'react'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import type { DynamicRangeResult } from '@/types/lighting'

interface Props { dynamicRange: DynamicRangeResult }

const DynamicRangePanel: React.FC<Props> = ({ dynamicRange }) => (
  <Box>
    <Stack direction="row" gap={1} mb={2} flexWrap="wrap">
      <Chip label={`Effective DR: ${dynamicRange.effective_dr_stops} stops`} size="small"
        sx={{ bgcolor: 'rgba(99,102,241,0.15)', color: '#6366F1', fontWeight: 700 }} />
      <Chip label={`Usable DR: ${dynamicRange.usable_dr_stops} stops`} size="small" />
    </Stack>

    <Stack direction="row" gap={2} flexWrap="wrap">
      {[
        { label: 'Effective Dynamic Range', value: `${dynamicRange.effective_dr_stops} stops`, desc: 'log₂(signal / noise_floor)' },
        { label: 'Usable Dynamic Range',    value: `${dynamicRange.usable_dr_stops} stops`,   desc: 'Effective DR – 1 stop margin' },
        { label: 'Signal Mean',             value: dynamicRange.signal_mean.toFixed(2),         desc: 'Mean value after dark subtraction' },
        { label: 'Noise Floor',             value: dynamicRange.noise_floor.toFixed(4),         desc: 'Std of dark frame' },
      ].map(({ label, value, desc }) => (
        <Paper key={label} variant="outlined" sx={{ p: 2, flex: '1 1 180px' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
          <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#6366F1' }}>
            {value}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>{desc}</Typography>
        </Paper>
      ))}
    </Stack>

    {/* DR stops bar */}
    <Box sx={{ mt: 3 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
        Dynamic range scale (stops)
      </Typography>
      <Box sx={{ position: 'relative', height: 32, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={{
          position: 'absolute', top: 0, left: 0, height: '100%',
          width: `${Math.min(100, (dynamicRange.effective_dr_stops / 14) * 100)}%`,
          bgcolor: '#6366F1', borderRadius: 1, transition: 'width 0.5s',
        }} />
        <Box sx={{
          position: 'absolute', top: 0, left: 0, height: '100%',
          width: `${Math.min(100, (dynamicRange.usable_dr_stops / 14) * 100)}%`,
          bgcolor: '#10B981', borderRadius: 1, opacity: 0.7,
        }} />
      </Box>
      <Stack direction="row" justifyContent="space-between" mt={0.5}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>0 stops</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>14 stops (reference)</Typography>
      </Stack>
      <Stack direction="row" gap={2} mt={1}>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Box sx={{ width: 10, height: 10, bgcolor: '#6366F1', borderRadius: 0.5 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Effective</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Box sx={{ width: 10, height: 10, bgcolor: '#10B981', borderRadius: 0.5, opacity: 0.7 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Usable</Typography>
        </Stack>
      </Stack>
    </Box>
  </Box>
)

export default DynamicRangePanel
