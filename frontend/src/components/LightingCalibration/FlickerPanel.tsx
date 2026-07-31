import React, { useMemo } from 'react'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { FlickerResult } from '@/types/lighting'

interface Props { flicker: FlickerResult }

const FlickerPanel: React.FC<Props> = ({ flicker }) => {
  const timeData = useMemo(() =>
    flicker.frame_indices.map((i, idx) => ({
      frame: i,
      brightness: flicker.brightness_over_time[idx] ?? 0,
    })),
    [flicker]
  )

  const fftData = useMemo(() => {
    const half = Math.min(flicker.fft_frequencies.length, flicker.fft_amplitudes.length)
    return Array.from({ length: half }, (_, i) => ({
      freq: parseFloat(flicker.fft_frequencies[i].toFixed(4)),
      amp: parseFloat(flicker.fft_amplitudes[i].toFixed(4)),
    }))
  }, [flicker])

  const color = flicker.has_flicker ? '#EF4444' : '#10B981'

  return (
    <Box>
      <Stack direction="row" gap={1} mb={2} flexWrap="wrap" alignItems="center">
        <Chip
          label={flicker.has_flicker ? `⚠ FLICKER DETECTED (${flicker.flicker_pct}%)` : '✓ No flicker detected'}
          size="small"
          sx={{ bgcolor: `${color}22`, color, fontWeight: 700 }}
        />
        <Chip label={`Mean: ${flicker.mean.toFixed(1)}`} size="small" />
        <Chip label={`Std: ${flicker.std.toFixed(4)}`} size="small" />
        {flicker.frequency_estimate != null && (
          <Chip label={`Est. freq: ${flicker.frequency_estimate} Hz`} size="small"
            sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#EF4444' }} />
        )}
      </Stack>

      {/* Brightness over time */}
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
        Mean brightness per frame
      </Typography>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={timeData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="frame" tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'Frame', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
          <Tooltip />
          <ReferenceLine y={flicker.mean} stroke="#F59E0B" strokeDasharray="4 2" label={{ value: 'Mean', fill: '#F59E0B', fontSize: 10 }} />
          <Line type="monotone" dataKey="brightness" stroke={color} dot={false} strokeWidth={1.5} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* FFT spectrum */}
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2, mb: 1 }}>
        FFT spectrum (normalised amplitude)
      </Typography>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={fftData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="freq" tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'Frequency (×Fs)', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 1]} />
          <Tooltip />
          <Bar dataKey="amp" fill="#6366F1" />
        </ComposedChart>
      </ResponsiveContainer>

      {flicker.has_flicker && (
        <Paper variant="outlined" sx={{ p: 1.5, mt: 2, borderColor: 'rgba(239,68,68,0.3)', bgcolor: 'rgba(239,68,68,0.05)' }}>
          <Typography variant="body2" sx={{ color: '#EF4444', fontWeight: 600 }}>Recommendations</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            • Use a DC-regulated power supply for the light source
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            • Synchronize the camera trigger with the light PWM frequency
          </Typography>
          {flicker.frequency_estimate != null && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              • Adjust frame rate so it is a multiple of the flicker frequency ({flicker.frequency_estimate} Hz)
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  )
}

export default FlickerPanel
