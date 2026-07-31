import React, { useState } from 'react'
import {
  Alert, Box, CircularProgress, Collapse, Divider,
  IconButton, Paper, Stack, Tab, Tabs, Typography,
} from '@mui/material'
import { ExpandLess as CollapseIcon, ExpandMore as ExpandIcon, Analytics as QIcon } from '@mui/icons-material'
import { useMutation } from '@tanstack/react-query'
import { analyzeQuality } from '@/services/imageQualityApi'
import type { ImageQualityResult } from '@/types/imageQuality'

import ImageQualityUpload from './ImageQualityUpload'
import QualityScoreCard from './QualityScoreCard'
import SharpnessPanel from './SharpnessPanel'
import BlurPanel from './BlurPanel'
import NoiseExposurePanel from './NoiseExposurePanel'
import ContrastPanel from './ContrastPanel'
import ColorPanel from './ColorPanel'
import StatisticsPanel from './StatisticsPanel'
import RecommendationsPanel from '../LightingCalibration/RecommendationsPanel'

const TABS = [
  { label: 'Sharpness',         key: 'sharp' },
  { label: 'Blur',              key: 'blur' },
  { label: 'Noise & Exposure',  key: 'noise' },
  { label: 'Contrast & SNR',    key: 'contrast' },
  { label: 'Color',             key: 'color' },
  { label: 'Statistics',        key: 'stats' },
  { label: 'Recommendations',   key: 'recs' },
]

const ImageQuality: React.FC = () => {
  const [tab, setTab] = useState(0)
  const [uploadOpen, setUploadOpen] = useState(true)

  const { mutate, isPending, error, data } = useMutation<ImageQualityResult, Error, File[]>({
    mutationFn: images => analyzeQuality(images),
    onSuccess: () => setUploadOpen(false),
  })

  const renderTab = (r: ImageQualityResult) => {
    switch (TABS[tab]?.key) {
      case 'sharp':    return <SharpnessPanel sharpness={r.sharpness} />
      case 'blur':     return <BlurPanel blur={r.blur} />
      case 'noise':    return <NoiseExposurePanel noise={r.noise} exposure={r.exposure} />
      case 'contrast': return <ContrastPanel contrast={r.contrast} dynamicRange={r.dynamic_range} snrCnr={r.snr_cnr} />
      case 'color':    return <ColorPanel color={r.color} />
      case 'stats':    return <StatisticsPanel stats={r.statistics} />
      case 'recs':     return <RecommendationsPanel recommendations={r.recommendations} />
      default: return null
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" gap={1} px={2} py={1}
        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <QIcon sx={{ color: '#6366F1', fontSize: 22 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
          Image Quality Evaluation
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
          Objective metrics: sharpness · blur · noise · contrast · exposure · color
        </Typography>
      </Stack>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Upload (collapsible) */}
        <Paper variant="outlined">
          <Stack direction="row" alignItems="center" justifyContent="space-between" px={2} py={1}
            onClick={() => setUploadOpen(v => !v)}
            sx={{ cursor: 'pointer', userSelect: 'none' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Upload Images</Typography>
            <IconButton size="small">
              {uploadOpen ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
          </Stack>
          <Collapse in={uploadOpen}>
            <Divider />
            <ImageQualityUpload onAnalyze={images => mutate(images)} isLoading={isPending} />
          </Collapse>
        </Paper>

        {isPending && (
          <Stack alignItems="center" gap={2} py={4}>
            <CircularProgress size={48} sx={{ color: '#6366F1' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Evaluating image quality…
            </Typography>
          </Stack>
        )}

        {error && !isPending && (
          <Alert severity="error">{error.message || 'Analysis failed'}</Alert>
        )}

        {data && !isPending && (
          <>
            <QualityScoreCard result={data} />

            <Paper variant="outlined" sx={{ flex: 1 }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '& .MuiTab-root': { fontSize: '0.75rem', minHeight: 40 },
                }}
              >
                {TABS.map(t => <Tab key={t.key} label={t.label} sx={{ minHeight: 40 }} />)}
              </Tabs>
              <Box sx={{ p: 2.5 }}>{renderTab(data)}</Box>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  )
}

export default ImageQuality
