import React from 'react'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts'
import type { ImageQualityResult } from '@/types/imageQuality'

const SCORE_COLOR = (s: number) =>
  s >= 85 ? '#10B981' : s >= 65 ? '#3B82F6' : s >= 45 ? '#F59E0B' : '#EF4444'

const CATEGORY_BG: Record<string, string> = {
  Excellent: 'rgba(16,185,129,0.1)',
  Good: 'rgba(59,130,246,0.1)',
  Acceptable: 'rgba(245,158,11,0.1)',
  Poor: 'rgba(239,68,68,0.1)',
}

const CircleGauge: React.FC<{ score: number }> = ({ score }) => {
  const r = 42
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = SCORE_COLOR(score)
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
      <circle
        cx="55" cy="55" r={r} fill="none"
        stroke={color} strokeWidth="9"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
      />
      <text x="55" y="52" textAnchor="middle" fill={color} fontSize="22" fontWeight="bold" fontFamily="monospace">
        {Math.round(score)}
      </text>
      <text x="55" y="68" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11">
        /100
      </text>
    </svg>
  )
}

interface Props { result: ImageQualityResult }

const QualityScoreCard: React.FC<Props> = ({ result }) => {
  const color = SCORE_COLOR(result.overall_score)
  const app = result.application_scores

  const radarData = [
    { subject: 'AI Inspect',   score: app.ai_inspection },
    { subject: 'OCR',          score: app.ocr },
    { subject: 'Measurement',  score: app.measurement },
    { subject: 'Object Det.',  score: app.object_detection },
    { subject: 'Defect Det.',  score: app.defect_detection },
    { subject: 'Pattern',      score: app.pattern_matching },
  ]

  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: color, borderWidth: 2, bgcolor: CATEGORY_BG[result.quality_category] }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={3} alignItems="center">
        {/* Circle gauge */}
        <Stack alignItems="center" gap={0.5}>
          <CircleGauge score={result.overall_score} />
          <Chip
            label={result.quality_category.toUpperCase()}
            size="small"
            sx={{ bgcolor: `${color}22`, color, fontWeight: 800, letterSpacing: 1 }}
          />
        </Stack>

        {/* Info chips */}
        <Stack gap={1} flex={1}>
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Chip label={`${result.image_shape[1]}×${result.image_shape[0]}`} size="small" />
            <Chip label={`${result.bit_depth}-bit`} size="small" />
            <Chip label={result.is_color ? 'Color' : 'Grayscale'} size="small" />
            <Chip label={`Sharpness: ${result.sharpness.sharpness_score}/100`} size="small"
              sx={{ color: SCORE_COLOR(result.sharpness.sharpness_score) }} />
            <Chip label={`Noise: ${result.noise.noise_score}/100`} size="small"
              sx={{ color: SCORE_COLOR(result.noise.noise_score) }} />
            <Chip label={`Contrast: ${result.contrast.contrast_score}/100`} size="small"
              sx={{ color: SCORE_COLOR(result.contrast.contrast_score) }} />
            <Chip label={`Exposure: ${result.exposure.exposure_score}/100`} size="small"
              sx={{ color: SCORE_COLOR(result.exposure.exposure_score) }} />
            <Chip label={`SNR: ${result.snr_cnr.snr_db} dB`} size="small"
              sx={{ color: SCORE_COLOR(result.snr_cnr.snr_score) }} />
          </Stack>
        </Stack>

        {/* Radar chart — application scores */}
        <Box sx={{ width: 240, height: 180 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
            Application suitability
          </Typography>
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart data={radarData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#64748b' }} />
              <Radar name="Score" dataKey="score" stroke={color} fill={color} fillOpacity={0.25} />
              <Tooltip formatter={(v: number) => `${v.toFixed(0)}/100`} />
            </RadarChart>
          </ResponsiveContainer>
        </Box>
      </Stack>
    </Paper>
  )
}

export default QualityScoreCard
