import React, { useState } from 'react'
import {
  Alert, Box, CircularProgress, Collapse, Divider, IconButton,
  Paper, Stack, Tab, Tabs, Typography,
} from '@mui/material'
import {
  ExpandLess as CollapseIcon,
  ExpandMore as ExpandIcon,
  Tungsten as LightIcon,
} from '@mui/icons-material'
import { useMutation } from '@tanstack/react-query'
import { analyzeLighting } from '@/services/lightingApi'
import type { LightingAnalysisResult } from '@/types/lighting'

import UploadZone from './UploadZone'
import SummaryCard from './SummaryCard'
import BrightnessPanel from './BrightnessPanel'
import HistogramPanel from './HistogramPanel'
import UniformityPanel from './UniformityPanel'
import HotspotPanel from './HotspotPanel'
import NoisePanel from './NoisePanel'
import FlickerPanel from './FlickerPanel'
import DynamicRangePanel from './DynamicRangePanel'
import RecommendationsPanel from './RecommendationsPanel'

const TABS = [
  { label: 'Brightness',     key: 'brightness' },
  { label: 'Histogram',      key: 'histogram' },
  { label: 'Uniformity',     key: 'uniformity' },
  { label: 'Hotspots',       key: 'hotspots' },
  { label: 'Noise & SNR',    key: 'noise' },
  { label: 'Flicker',        key: 'flicker' },
  { label: 'Dynamic Range',  key: 'dynrange' },
  { label: 'Recommendations',key: 'recs' },
]

const LightingCalibration: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [uploadOpen, setUploadOpen] = useState(true)

  const { mutate, isPending, error, data } = useMutation<
    LightingAnalysisResult,
    Error,
    { sequence: File[]; whiteRef: File | null; darkFrame: File | null }
  >({
    mutationFn: ({ sequence, whiteRef, darkFrame }) => analyzeLighting(sequence, whiteRef, darkFrame),
    onSuccess: () => setUploadOpen(false),
  })

  const handleAnalyze = (sequence: File[], whiteRef: File | null, darkFrame: File | null) => {
    mutate({ sequence, whiteRef, darkFrame })
  }

  const renderTab = (result: LightingAnalysisResult) => {
    const key = TABS[activeTab]?.key
    const maxVal = 2 ** result.bit_depth - 1

    switch (key) {
      case 'brightness':  return <BrightnessPanel brightness={result.brightness} maxVal={maxVal} />
      case 'histogram':   return <HistogramPanel histogram={result.histogram} />
      case 'uniformity':  return <UniformityPanel uniformity={result.uniformity} />
      case 'hotspots':    return <HotspotPanel hotspots={result.hotspots} />
      case 'noise':       return <NoisePanel noise={result.noise} snr={result.snr} />
      case 'flicker':
        return result.flicker
          ? <FlickerPanel flicker={result.flicker} />
          : <Alert severity="info">Flicker analysis requires at least 5 frames.</Alert>
      case 'dynrange':
        return result.dynamic_range
          ? <DynamicRangePanel dynamicRange={result.dynamic_range} />
          : <Alert severity="info">Dynamic range analysis requires both a white reference and dark frame.</Alert>
      case 'recs':
        return <RecommendationsPanel recommendations={result.recommendations} />
      default: return null
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" gap={1} px={2} py={1} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <LightIcon sx={{ color: '#F59E0B', fontSize: 22 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
          Lighting Calibration
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
          Upload image sequence to analyze lighting quality
        </Typography>
      </Stack>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Upload section (collapsible after analysis) */}
        <Paper variant="outlined">
          <Stack
            direction="row" alignItems="center" justifyContent="space-between"
            px={2} py={1}
            onClick={() => setUploadOpen(v => !v)}
            sx={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Upload Images</Typography>
            <IconButton size="small">
              {uploadOpen ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
          </Stack>
          <Collapse in={uploadOpen}>
            <Divider />
            <UploadZone onAnalyze={handleAnalyze} isLoading={isPending} />
          </Collapse>
        </Paper>

        {/* Loading */}
        {isPending && (
          <Stack alignItems="center" gap={2} py={4}>
            <CircularProgress size={48} sx={{ color: '#F59E0B' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Analyzing lighting quality…
            </Typography>
          </Stack>
        )}

        {/* Error */}
        {error && !isPending && (
          <Alert severity="error">
            {error.message || 'Analysis failed — check backend logs'}
          </Alert>
        )}

        {/* Results */}
        {data && !isPending && (
          <>
            <SummaryCard result={data} />

            <Paper variant="outlined" sx={{ flex: 1 }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '& .MuiTab-root': { fontSize: '0.75rem', minHeight: 40 },
                }}
              >
                {TABS.map((t, i) => (
                  <Tab key={t.key} label={t.label} sx={{ minHeight: 40 }} />
                ))}
              </Tabs>
              <Box sx={{ p: 2.5 }}>
                {renderTab(data)}
              </Box>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  )
}

export default LightingCalibration
