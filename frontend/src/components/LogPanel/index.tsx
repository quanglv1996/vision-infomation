import React, { useRef, useEffect } from 'react'
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { DeleteOutline as ClearIcon } from '@mui/icons-material'
import { useCalcStore } from '@/stores/calculationStore'

const LEVEL_COLORS = {
  info: '#3B82F6',
  warn: '#F59E0B',
  error: '#EF4444',
} as const

const LogPanel: React.FC = () => {
  const { log } = useCalcStore()
  const endRef = useRef<HTMLDivElement>(null)

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#080B12',
        borderTop: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          px: 2,
          py: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'text.secondary' }}>
          Calculation Log
        </Typography>
        <Chip label={log.length} size="small" sx={{ ml: 1, height: 16, fontSize: '0.62rem' }} />
        <Box sx={{ flex: 1 }} />
      </Stack>

      {/* Entries */}
      <Box sx={{ flex: 1, overflowY: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72rem', px: 1 }}>
        {log.length === 0 ? (
          <Typography variant="caption" sx={{ color: 'text.secondary', px: 1, py: 1, display: 'block' }}>
            No log entries yet. Run a calculation to see results here.
          </Typography>
        ) : (
          log.map(entry => (
            <Stack key={entry.id} direction="row" gap={1} alignItems="baseline" sx={{ py: 0.3, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <Typography component="span" sx={{ color: '#475569', fontSize: '0.65rem', flexShrink: 0 }}>
                {entry.timestamp.toLocaleTimeString()}
              </Typography>
              <Chip
                label={entry.level}
                size="small"
                sx={{
                  height: 14,
                  fontSize: '0.58rem',
                  bgcolor: `${LEVEL_COLORS[entry.level]}20`,
                  color: LEVEL_COLORS[entry.level],
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ fontSize: '0.72rem', color: entry.level === 'error' ? '#FCA5A5' : entry.level === 'warn' ? '#FCD34D' : '#CBD5E1' }}>
                {entry.message}
              </Typography>
            </Stack>
          ))
        )}
        <div ref={endRef} />
      </Box>
    </Box>
  )
}

export default LogPanel
