import React from 'react'
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Calculate as CalculateIcon,
  ClearAll as ClearAllIcon,
  Download as DownloadIcon,
  FolderOpen as FolderOpenIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { useCalcStore } from '@/stores/calculationStore'

const Toolbar: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar()
  const { calculate, clearAll, isCalculating, lastResult, params } = useCalcStore()

  const inputCount = Object.values(params).filter(p => p.status === 'input').length
  const calcCount = Object.values(params).filter(p =>
    p.status === 'calculated' || p.status === 'inverse',
  ).length

  const handleCalculate = async () => {
    await calculate()
    if (lastResult?.warnings.some(w => w.severity === 'error')) {
      enqueueSnackbar('Calculation complete with errors — check warnings', { variant: 'error' })
    } else if (lastResult?.warnings.length) {
      enqueueSnackbar(`Calculation complete — ${lastResult.warnings.length} warning(s)`, { variant: 'warning' })
    } else {
      enqueueSnackbar('Calculation complete', { variant: 'success' })
    }
  }

  const handleExport = () => {
    const data = useCalcStore.getState().lastResult
    if (!data) { enqueueSnackbar('Nothing to export — run calculation first', { variant: 'info' }); return }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'mv-calc-result.json'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        height: 48,
        zIndex: 10,
      }}
    >
      <Stack direction="row" alignItems="center" sx={{ height: '100%', px: 2, gap: 1 }}>
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
          <Box
            component="span"
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3B82F6, #10B981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.6rem',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            MV
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5, color: 'text.primary' }}>
            Vision Calculator
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Primary action */}
        <Button
          variant="contained"
          startIcon={isCalculating ? <CircularProgress size={14} color="inherit" /> : <CalculateIcon />}
          onClick={handleCalculate}
          disabled={isCalculating || inputCount === 0}
          size="small"
          sx={{ minWidth: 120 }}
        >
          {isCalculating ? 'Calculating…' : 'Calculate'}
        </Button>

        <Tooltip title="Clear all values">
          <IconButton size="small" onClick={clearAll} disabled={isCalculating}>
            <ClearAllIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <Tooltip title="Save project">
          <IconButton size="small" disabled={isCalculating}>
            <SaveIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Open project">
          <IconButton size="small" disabled={isCalculating}>
            <FolderOpenIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Export JSON">
          <IconButton size="small" onClick={handleExport}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Status bar */}
        {(inputCount > 0 || calcCount > 0) && (
          <Stack direction="row" gap={1.5} alignItems="center">
            {inputCount > 0 && (
              <Typography variant="caption" sx={{ color: '#3B82F6' }}>
                {inputCount} input{inputCount !== 1 ? 's' : ''}
              </Typography>
            )}
            {calcCount > 0 && (
              <Typography variant="caption" sx={{ color: '#10B981' }}>
                {calcCount} calculated
              </Typography>
            )}
            {lastResult && lastResult.warnings.length > 0 && (
              <Typography variant="caption" sx={{ color: '#F59E0B' }}>
                ⚠ {lastResult.warnings.length} warning{lastResult.warnings.length !== 1 ? 's' : ''}
              </Typography>
            )}
          </Stack>
        )}

        <Typography variant="caption" sx={{ color: 'text.secondary', ml: 2 }}>
          v1.0.0
        </Typography>
      </Stack>
    </AppBar>
  )
}

export default Toolbar
