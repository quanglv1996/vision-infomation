import React from 'react'
import { Box, Chip, Paper, Stack, Typography, Divider } from '@mui/material'
import {
  CheckCircle as PassIcon,
  Warning as WarnIcon,
  Cancel as FailIcon,
} from '@mui/icons-material'
import type { LightingAnalysisResult } from '@/types/lighting'

const STATUS_MAP = {
  pass:    { label: 'PASS',    color: '#10B981', Icon: PassIcon },
  warning: { label: 'WARNING', color: '#F59E0B', Icon: WarnIcon },
  fail:    { label: 'FAIL',    color: '#EF4444', Icon: FailIcon },
}

const Stat: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <Box sx={{ textAlign: 'center' }}>
    <Typography variant="h6" sx={{ fontWeight: 700, color: color ?? 'text.primary', fontFamily: 'monospace' }}>
      {value}
    </Typography>
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
  </Box>
)

interface Props { result: LightingAnalysisResult }

const SummaryCard: React.FC<Props> = ({ result }) => {
  const { label, color, Icon } = STATUS_MAP[result.overall_status]

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderColor: color, borderWidth: 2, bgcolor: `${color}0D` }}
    >
      <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
        {/* Overall status */}
        <Stack direction="row" alignItems="center" gap={1}>
          <Icon sx={{ color, fontSize: 36 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color, lineHeight: 1 }}>{label}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Overall Status</Typography>
          </Box>
        </Stack>

        <Divider orientation="vertical" flexItem />

        {/* Quick stats */}
        <Stack direction="row" gap={3} flexWrap="wrap" flex={1}>
          <Stat label="Frames" value={String(result.num_frames)} />
          <Stat label="Resolution" value={`${result.image_shape[1]}×${result.image_shape[0]}`} />
          <Stat label="Bit Depth" value={`${result.bit_depth}-bit`} />
          <Stat
            label="Brightness"
            value={`${result.brightness.pct_of_full_scale}%`}
            color={result.brightness.status === 'pass' ? '#10B981' : result.brightness.status === 'warning' ? '#F59E0B' : '#EF4444'}
          />
          <Stat
            label="Uniformity"
            value={`${result.uniformity.uniformity_min_max}%`}
            color={result.uniformity.status === 'excellent' ? '#10B981' : result.uniformity.status === 'good' ? '#3B82F6' : result.uniformity.status === 'acceptable' ? '#F59E0B' : '#EF4444'}
          />
          <Stat
            label="SNR"
            value={`${result.snr.snr_db} dB`}
            color={result.snr.status === 'excellent' ? '#10B981' : result.snr.status === 'good' ? '#F59E0B' : '#EF4444'}
          />
          {result.flicker && (
            <Stat
              label="Flicker"
              value={result.flicker.has_flicker ? `${result.flicker.flicker_pct}%` : 'None'}
              color={result.flicker.has_flicker ? '#EF4444' : '#10B981'}
            />
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}

export default SummaryCard
