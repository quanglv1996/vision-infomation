import React from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import type { ImageStatistics } from '@/types/imageQuality'

interface Props { stats: ImageStatistics }

const StatisticsPanel: React.FC<Props> = ({ stats }) => {
  const rows = [
    { label: 'Mean',         value: stats.mean.toFixed(3),         desc: 'Average pixel intensity' },
    { label: 'Median',       value: stats.median.toFixed(3),       desc: 'Middle value of distribution' },
    { label: 'Std Dev',      value: stats.std.toFixed(3),          desc: 'Standard deviation' },
    { label: 'Variance',     value: stats.variance.toFixed(3),     desc: 'σ²' },
    { label: 'Entropy',      value: stats.entropy.toFixed(4),      desc: 'Information content (bits)' },
    { label: 'Skewness',     value: stats.skewness.toFixed(4),     desc: '>0 right-skewed, <0 left-skewed' },
    { label: 'Kurtosis',     value: stats.kurtosis.toFixed(4),     desc: 'Tail heaviness (excess kurtosis)' },
    { label: 'Min',          value: stats.min_val.toFixed(3),      desc: 'Darkest pixel' },
    { label: 'Max',          value: stats.max_val.toFixed(3),      desc: 'Brightest pixel' },
    { label: 'P5',           value: stats.percentile_5.toFixed(3), desc: '5th percentile' },
    { label: 'P95',          value: stats.percentile_95.toFixed(3),desc: '95th percentile' },
  ]

  return (
    <Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Statistical distribution of pixel values
      </Typography>
      <Stack direction="row" gap={1} flexWrap="wrap">
        {rows.map(({ label, value, desc }) => (
          <Paper key={label} variant="outlined" sx={{ p: 1.5, flex: '1 1 130px' }}>
            <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{value}</Typography>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>{label}</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.65rem' }}>
              {desc}
            </Typography>
          </Paper>
        ))}
      </Stack>

      {/* Skewness / Kurtosis interpretation */}
      <Stack direction="row" gap={2} mt={2} flexWrap="wrap">
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Skewness {stats.skewness > 0.5 ? '→ Distribution skewed right (dark image)' : stats.skewness < -0.5 ? '→ Distribution skewed left (bright image)' : '→ Approximately symmetric'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Kurtosis {stats.kurtosis > 1 ? '→ Heavy-tailed (sharp histogram peak)' : stats.kurtosis < -1 ? '→ Light-tailed (flat histogram)' : '→ Normal-like distribution'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Entropy {stats.entropy.toFixed(2)} bits {stats.entropy > 7 ? '→ Rich texture, high information' : stats.entropy > 5 ? '→ Moderate detail' : '→ Low detail or very uniform image'}
        </Typography>
      </Stack>
    </Box>
  )
}

export default StatisticsPanel
