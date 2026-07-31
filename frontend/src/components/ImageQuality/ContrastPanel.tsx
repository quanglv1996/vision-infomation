import React from 'react'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import type { ContrastResult, DynamicRangeQuality, SNRCNRResult } from '@/types/imageQuality'

const SCORE_COLOR = (s: number) =>
  s >= 75 ? '#10B981' : s >= 50 ? '#F59E0B' : '#EF4444'

interface Props {
  contrast: ContrastResult
  dynamicRange: DynamicRangeQuality
  snrCnr: SNRCNRResult
}

const ContrastPanel: React.FC<Props> = ({ contrast, dynamicRange, snrCnr }) => {
  const cc = SCORE_COLOR(contrast.contrast_score)
  const snrColor = snrCnr.status === 'excellent' ? '#10B981' : snrCnr.status === 'good' ? '#F59E0B' : '#EF4444'

  const contrastMetrics = [
    { label: 'Michelson Contrast', value: contrast.michelson.toFixed(4),      tip: '(max−min)/(max+min)' },
    { label: 'RMS Contrast',       value: contrast.rms.toFixed(4),            tip: 'Root-mean-square deviation' },
    { label: 'Local Contrast',     value: contrast.local_mean.toFixed(4),     tip: 'Mean local edge contrast' },
    { label: 'Histogram Spread',   value: `${(contrast.histogram_spread * 100).toFixed(1)}%`, tip: 'P5–P95 range' },
  ]

  const drMetrics = [
    { label: 'Dynamic Range',    value: `${dynamicRange.dynamic_range_stops} stops` },
    { label: 'Effective Range',  value: `${dynamicRange.effective_range_pct}%` },
    { label: 'Shadow Clipped',   value: `${dynamicRange.shadow_clipped_pct}%` },
    { label: 'Highlight Clipped',value: `${dynamicRange.highlight_clipped_pct}%` },
    { label: 'Saturated Pixels', value: `${dynamicRange.saturated_pct}%` },
  ]

  return (
    <Box>
      {/* Contrast */}
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Contrast Analysis</Typography>
      <Stack direction="row" gap={1} mb={2} flexWrap="wrap">
        <Chip label={`${contrast.status.toUpperCase()} contrast`} size="small"
          sx={{ bgcolor: `${cc}22`, color: cc, fontWeight: 700 }} />
        <Chip label={`Score: ${contrast.contrast_score}/100`} size="small" sx={{ color: cc }} />
      </Stack>
      <Box sx={{ mb: 2, height: 8, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <Box sx={{ height: '100%', width: `${contrast.contrast_score}%`, bgcolor: cc, borderRadius: 4, transition: 'width 0.5s' }} />
      </Box>
      <Stack direction="row" gap={1} flexWrap="wrap" mb={3}>
        {contrastMetrics.map(({ label, value, tip }) => (
          <Paper key={label} variant="outlined" sx={{ p: 1.5, flex: '1 1 140px' }}>
            <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{value}</Typography>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>{label}</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>{tip}</Typography>
          </Paper>
        ))}
      </Stack>

      {/* Dynamic Range */}
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Dynamic Range</Typography>
      <Stack direction="row" gap={1} flexWrap="wrap" mb={3}>
        {drMetrics.map(({ label, value }) => (
          <Paper key={label} variant="outlined" sx={{ p: 1.5, flex: '1 1 120px' }}>
            <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{value}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
          </Paper>
        ))}
      </Stack>

      {/* SNR / CNR */}
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>SNR & CNR</Typography>
      <Stack direction="row" gap={1} mb={1} flexWrap="wrap">
        <Chip label={`${snrCnr.status.toUpperCase()} SNR`} size="small"
          sx={{ bgcolor: `${snrColor}22`, color: snrColor, fontWeight: 700 }} />
        <Chip label={`Score: ${snrCnr.snr_score}/100`} size="small" sx={{ color: snrColor }} />
      </Stack>
      <Stack direction="row" gap={2} flexWrap="wrap">
        <Paper variant="outlined" sx={{ p: 2, flex: '1 1 150px', borderColor: `${snrColor}44` }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>SNR</Typography>
          <Stack direction="row" alignItems="baseline" gap={1}>
            <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 800, color: snrColor }}>{snrCnr.snr_db}</Typography>
            <Typography sx={{ color: 'text.secondary' }}>dB</Typography>
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, flex: '1 1 150px' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>CNR (center vs corners)</Typography>
          <Stack direction="row" alignItems="baseline" gap={1}>
            <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{snrCnr.cnr_db}</Typography>
            <Typography sx={{ color: 'text.secondary' }}>dB</Typography>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}

export default ContrastPanel
