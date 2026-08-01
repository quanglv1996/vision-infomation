import React, { useState } from 'react'
import {
  Alert, Box, Chip, Collapse, IconButton,
  LinearProgress, Stack, Tab, Tabs, Tooltip, Typography,
} from '@mui/material'
import { CompareArrows as CompareIcon, ExpandLess, ExpandMore } from '@mui/icons-material'
import ComparisonUpload from './ComparisonUpload'
import SummaryTable    from './SummaryTable'
import MetricsCharts   from './MetricsCharts'
import HistogramOverlay from './HistogramOverlay'
import HeatmapGrid     from './HeatmapGrid'
import DiffPanel       from './DiffPanel'
import { analyzeComparison } from '@/services/imageComparisonApi'
import type { ComparisonResult, ComparisonWeights, ImageItem } from '@/types/imageComparison'

const COLORS = [
  '#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6',
  '#EC4899','#06B6D4','#84CC16','#F97316','#6366F1',
]

const ImageComparison: React.FC = () => {
  const [result,    setResult]    = useState<ComparisonResult | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [tab,       setTab]       = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  const handleAnalyze = async (items: ImageItem[], weights: ComparisonWeights, grayscale: boolean) => {
    setLoading(true); setError(null)
    try {
      const res = await analyzeComparison(items, weights, grayscale)
      setResult(res)
      setCollapsed(true)
      setTab(0)
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Comparison failed. Check images and try again.')
    } finally {
      setLoading(false)
    }
  }

  const tabs = result
    ? ['Summary', 'Charts & Radar', 'Histograms', 'Heatmaps', ...(result.diff_result ? ['Difference'] : [])]
    : []

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stack direction="row" alignItems="center" sx={{ px: 2, py: 0.5 }}>
          <CompareIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Typography variant="subtitle2" sx={{ flex: 1 }}>Image Comparison</Typography>
          {result && (
            <Stack direction="row" spacing={1}>
              <Chip
                label={`🏆 ${result.metrics[result.best_idx].name}`}
                size="small" sx={{ bgcolor: '#10B98122', color: '#10B981', fontWeight: 700 }}
              />
              <Chip
                label={`${result.n_images} images`}
                size="small" variant="outlined"
              />
            </Stack>
          )}
          <Tooltip title={collapsed ? 'Expand upload' : 'Collapse'}>
            <IconButton size="small" onClick={() => setCollapsed(c => !c)}>
              {collapsed ? <ExpandMore /> : <ExpandLess />}
            </IconButton>
          </Tooltip>
        </Stack>

        <Collapse in={!collapsed}>
          <ComparisonUpload onAnalyze={handleAnalyze} isLoading={loading} />
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
            {tabs.map((label, i) => <Tab key={i} label={label} />)}
          </Tabs>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {tabs[tab] === 'Summary'        && <SummaryTable     result={result} colors={COLORS} />}
            {tabs[tab] === 'Charts & Radar' && <MetricsCharts    result={result} colors={COLORS} />}
            {tabs[tab] === 'Histograms'     && <HistogramOverlay result={result} colors={COLORS} />}
            {tabs[tab] === 'Heatmaps'       && <HeatmapGrid      result={result} colors={COLORS} />}
            {tabs[tab] === 'Difference'     && <DiffPanel        result={result} colors={COLORS} />}
          </Box>
        </Box>
      ) : (
        !loading && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
            <CompareIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary" variant="body2">
              Upload 2–100 images to compare their quality metrics.
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Drag & drop, rename, reorder, configure weights, then click Compare.
            </Typography>
          </Box>
        )
      )}
    </Box>
  )
}

export default ImageComparison
