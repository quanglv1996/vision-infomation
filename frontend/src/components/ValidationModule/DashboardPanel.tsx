import React from 'react'
import {
  Box, Card, CardContent, Chip, CircularProgress, Grid,
  Stack, Typography,
} from '@mui/material'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import type { ValidationResult } from '@/types/validation'

interface Props { result: ValidationResult }

const VERDICT_COLOR: Record<string, string> = {
  'PASS': '#10B981', 'CONDITIONAL PASS': '#F59E0B', 'FAIL': '#EF4444',
}
const STATUS_COLOR: Record<string, string> = {
  excellent: '#10B981', capable: '#10B981', good: '#3B82F6',
  acceptable: '#3B82F6', marginal: '#F59E0B', poor: '#EF4444',
  incapable: '#EF4444', unacceptable: '#EF4444', 'n/a': '#6B7280',
}

const DashboardPanel: React.FC<Props> = ({ result }) => {
  const fs = result.final_score
  const vc = VERDICT_COLOR[fs.verdict] ?? '#9CA3AF'

  const radarData = fs.radar_labels.map((label, i) => ({
    subject: label, value: fs.radar_values[i],
    fullMark: 100,
  }))

  const modules = [
    { key: 'repeatability', label: 'Repeatability', result: result.repeatability },
    { key: 'accuracy',      label: 'Accuracy',      result: result.accuracy },
    { key: 'grr',           label: 'GR&R',           result: result.grr },
    { key: 'ai',            label: 'AI Performance', result: result.ai },
    { key: 'ocr',           label: 'OCR',            result: result.ocr },
    { key: 'runtime',       label: 'Runtime',        result: result.runtime },
    { key: 'stability',     label: 'Stability',      result: result.stability },
  ]

  return (
    <Box sx={{ p: 2 }}>
      {/* Verdict banner */}
      <Box sx={{ p: 2, mb: 2, border: `2px solid ${vc}`, borderRadius: 2, bgcolor: vc + '11', textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: vc, letterSpacing: 2 }}>
          {fs.verdict}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {result.system_name} — Overall Score: {fs.overall_score.toFixed(1)} / 100
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Gauge */}
        <Grid item xs={12} sm="auto">
          <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.03)', minWidth: 150, textAlign: 'center' }}>
            <CardContent>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate" value={fs.overall_score} size={110} thickness={6}
                  sx={{ color: vc, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
                />
                <CircularProgress variant="determinate" value={100} size={110} thickness={6}
                  sx={{ color: 'rgba(255,255,255,0.08)', position: 'absolute', left: 0 }} />
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: vc }}>{fs.overall_score.toFixed(0)}</Typography>
                  <Typography variant="caption" color="text.secondary">/ 100</Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>Overall Score</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Radar chart */}
        <Grid item xs={12} sm>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.12)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 9 }} tickCount={4} />
              <Radar dataKey="value" stroke={vc} fill={vc} fillOpacity={0.25}
                dot={{ r: 3, fill: vc }} />
            </RadarChart>
          </ResponsiveContainer>
        </Grid>
      </Grid>

      {/* Module score cards */}
      <Grid container spacing={1} sx={{ mt: 1 }}>
        {modules.map(({ label, result: r }) => {
          const cs = fs.component_scores[label]
          if (!cs?.available) return null
          const sc = STATUS_COLOR[r?.status ?? ''] ?? '#9CA3AF'
          return (
            <Grid item xs={6} sm={4} md key={label}>
              <Box sx={{ p: 1.5, border: '1px solid', borderColor: sc + '55', borderRadius: 1, bgcolor: sc + '0a', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 800, color: sc }}>
                  {cs.score.toFixed(0)}
                </Typography>
                <Chip label={r?.status ?? '—'} size="small" sx={{ fontSize: '0.6rem', height: 16, bgcolor: sc + '22', color: sc }} />
              </Box>
            </Grid>
          )
        })}
      </Grid>

      {/* Recommendations */}
      {fs.recommendations.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>Recommendations</Typography>
          <Stack spacing={0.5}>
            {fs.recommendations.map((r, i) => (
              <Box key={i} sx={{ px: 1.5, py: 0.75, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption">• {r}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  )
}

export default DashboardPanel
