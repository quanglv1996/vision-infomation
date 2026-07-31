import React, { useState } from 'react'
import {
  Alert, Box, Chip, Collapse, IconButton,
  LinearProgress, Stack, Tab, Tabs, Tooltip, Typography,
} from '@mui/material'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import ColorUpload      from './ColorUpload'
import WhiteBalancePanel from './WhiteBalancePanel'
import GrayBalancePanel  from './GrayBalancePanel'
import ColorSpacePanel   from './ColorSpacePanel'
import GammaPanel        from './GammaPanel'
import SaturationPanel   from './SaturationPanel'
import UniformityPanel   from './UniformityPanel'
import WhitePointPanel   from './WhitePointPanel'
import ColorCheckerPanel from './ColorCheckerPanel'
import ColorReportPanel  from './ReportPanel'
import { analyzeColor }  from '@/services/colorCalibrationApi'
import type { ColorCalibrationResult } from '@/types/colorCalibration'

const TYPE_LABEL: Record<string, string> = {
  white_card: 'White Card', gray_card: 'Gray Card',
  colorchecker: 'ColorChecker', reference: 'Reference',
}

const ColorCalibration: React.FC = () => {
  const [result,    setResult]    = useState<ColorCalibrationResult | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [tab,       setTab]       = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  const handleAnalyze = async (image: File, imageType: string) => {
    setLoading(true); setError(null)
    try {
      const res = await analyzeColor(image, imageType)
      setResult(res)
      setCollapsed(true)
      setTab(0)
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Analysis failed.')
    } finally {
      setLoading(false)
    }
  }

  const TABS = [
    'White Balance', 'Gray Balance', 'Color Space', 'Gamma',
    'Saturation', 'Uniformity', 'White Point',
    ...(result?.color_checker ? ['ColorChecker'] : []),
    'Report',
  ]

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Upload header */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stack direction="row" alignItems="center" sx={{ px: 2, py: 0.5 }}>
          <Typography variant="subtitle2" sx={{ flex: 1 }}>Color Calibration — Upload</Typography>
          {result && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={`WB ${result.white_balance.wb_score.toFixed(0)}/100 · ${result.white_balance.color_temperature_k.toFixed(0)}K`}
                size="small"
                sx={{ bgcolor: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontWeight: 700 }}
              />
              <Chip
                label={TYPE_LABEL[result.image_type] ?? result.image_type}
                size="small" variant="outlined"
              />
            </Stack>
          )}
          <Tooltip title={collapsed ? 'Expand' : 'Collapse'}>
            <IconButton size="small" onClick={() => setCollapsed(c => !c)}>
              {collapsed ? <ExpandMore /> : <ExpandLess />}
            </IconButton>
          </Tooltip>
        </Stack>

        <Collapse in={!collapsed}>
          <ColorUpload onAnalyze={handleAnalyze} isLoading={loading} />
        </Collapse>

        {loading && <LinearProgress />}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mx: 2, mb: 1, fontSize: '0.8rem' }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Results */}
      {result ? (
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Tabs
            value={tab} onChange={(_, v) => setTab(v)}
            variant="scrollable" scrollButtons="auto"
            sx={{ borderBottom: '1px solid', borderColor: 'divider', minHeight: 38,
              '& .MuiTab-root': { minHeight: 38, fontSize: '0.74rem', py: 0.5 } }}
          >
            {TABS.map((label, i) => <Tab key={i} label={label} />)}
          </Tabs>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {tab === 0 && <WhiteBalancePanel  result={result} />}
            {tab === 1 && <GrayBalancePanel   result={result} />}
            {tab === 2 && <ColorSpacePanel    result={result} />}
            {tab === 3 && <GammaPanel         result={result} />}
            {tab === 4 && <SaturationPanel    result={result} />}
            {tab === 5 && <UniformityPanel    result={result} />}
            {tab === 6 && <WhitePointPanel    result={result} />}
            {result.color_checker && tab === 7 && <ColorCheckerPanel result={result} />}
            {tab === (result.color_checker ? 8 : 7) && <ColorReportPanel result={result} />}
          </Box>
        </Box>
      ) : (
        !loading && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary" variant="body2">
              Upload a white card, gray card, or ColorChecker image and click Analyze.
            </Typography>
          </Box>
        )
      )}
    </Box>
  )
}

export default ColorCalibration
