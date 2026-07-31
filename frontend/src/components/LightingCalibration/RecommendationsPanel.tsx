import React from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import {
  Lightbulb as TipIcon,
  ErrorOutline as WarnIcon,
  CheckCircleOutline as OkIcon,
} from '@mui/icons-material'

interface Props { recommendations: string[] }

function iconFor(text: string) {
  if (text.startsWith('Lighting quality is excellent')) return <OkIcon sx={{ color: '#10B981', fontSize: 18, mt: 0.1 }} />
  if (text.toLowerCase().includes('detected') || text.toLowerCase().includes('clipping'))
    return <WarnIcon sx={{ color: '#EF4444', fontSize: 18, mt: 0.1 }} />
  return <TipIcon sx={{ color: '#F59E0B', fontSize: 18, mt: 0.1 }} />
}

const RecommendationsPanel: React.FC<Props> = ({ recommendations }) => (
  <Box>
    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
      Auto-generated recommendations based on analysis results
    </Typography>
    <Stack gap={1}>
      {recommendations.map((rec, i) => (
        <Paper key={i} variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction="row" gap={1} alignItems="flex-start">
            {iconFor(rec)}
            <Typography variant="body2">{rec}</Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  </Box>
)

export default RecommendationsPanel
