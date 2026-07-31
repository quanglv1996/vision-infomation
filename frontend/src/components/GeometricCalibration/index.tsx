import React, { useState } from 'react'
import {
  Alert, Box, Chip, Collapse, IconButton, LinearProgress,
  Stack, Tab, Tabs, Tooltip, Typography,
} from '@mui/material'
import {
  ExpandLess, ExpandMore,
  CheckCircle as OkIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'
import CalibUpload    from './CalibUpload'
import IntrinsicPanel from './IntrinsicPanel'
import DistortionPanel from './DistortionPanel'
import LensVizPanel   from './LensVizPanel'
import PosePanel      from './PosePanel'
import QualityPanel   from './QualityPanel'
import PixelCalibPanel from './PixelCalibPanel'
import PerspectivePanel from './PerspectivePanel'
import ReportPanel    from './ReportPanel'
import { calibrateGeometric } from '@/services/geometricCalibrationApi'
import type { CalibrationParams, GeometricCalibrationResult } from '@/types/geometricCalibration'

const STATUS_COLOR: Record<string, string> = {
  excellent: '#10B981', good: '#3B82F6', acceptable: '#F59E0B', poor: '#EF4444',
}

const GeometricCalibration: React.FC = () => {
  const [result,    setResult]    = useState<GeometricCalibrationResult | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [tab,       setTab]       = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  const handleCalibrate = async (images: File[], params: CalibrationParams) => {
    setLoading(true); setError(null)
    try {
      const res = await calibrateGeometric(images, params)
      setResult(res)
      setCollapsed(true)
      setTab(0)
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Calibration failed. Check images and board settings.')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = result ? STATUS_COLOR[result.quality.status] ?? '#9CA3AF' : '#9CA3AF'

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Upload section */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stack direction="row" alignItems="center" sx={{ px: 2, py: 0.5 }}>
          <Typography variant="subtitle2" sx={{ flex: 1 }}>
            Geometric Calibration — Upload
          </Typography>
          {result && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                icon={result.quality.status === 'poor' ? <ErrorIcon /> : <OkIcon />}
                label={`Score ${result.quality.calibration_score.toFixed(0)}/100 · RMS ${result.quality.rms_error.toFixed(3)} px`}
                size="small"
                sx={{ bgcolor: scoreColor + '22', color: scoreColor, fontWeight: 700 }}
              />
              <Chip
                label={`${result.num_images_used}/${result.num_images_total} images`}
                size="small" variant="outlined"
              />
            </Stack>
          )}
          <Tooltip title={collapsed ? 'Expand upload' : 'Collapse upload'}>
            <IconButton size="small" onClick={() => setCollapsed(c => !c)}>
              {collapsed ? <ExpandMore /> : <ExpandLess />}
            </IconButton>
          </Tooltip>
        </Stack>

        <Collapse in={!collapsed}>
          <CalibUpload onCalibrate={handleCalibrate} isLoading={loading} />
        </Collapse>

        {loading && <LinearProgress />}

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mx: 2, mb: 1, fontSize: '0.8rem' }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Results area */}
      {result ? (
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable" scrollButtons="auto"
            sx={{ borderBottom: '1px solid', borderColor: 'divider', minHeight: 38,
              '& .MuiTab-root': { minHeight: 38, fontSize: '0.75rem', py: 0.5 } }}
          >
            {['Quality', 'Intrinsic', 'Distortion', 'Lens Viz', 'Poses', 'Pixel Calib', 'Perspective', 'Report'].map((label, i) => (
              <Tab key={i} label={label} />
            ))}
          </Tabs>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {tab === 0 && <QualityPanel     result={result} />}
            {tab === 1 && <IntrinsicPanel   result={result} />}
            {tab === 2 && <DistortionPanel  result={result} />}
            {tab === 3 && <LensVizPanel     result={result} />}
            {tab === 4 && <PosePanel        result={result} />}
            {tab === 5 && <PixelCalibPanel  result={result} />}
            {tab === 6 && <PerspectivePanel result={result} />}
            {tab === 7 && <ReportPanel      result={result} />}
          </Box>
        </Box>
      ) : (
        !loading && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary" variant="body2">
              Upload calibration images and click Calibrate to begin.
            </Typography>
          </Box>
        )
      )}
    </Box>
  )
}

export default GeometricCalibration
