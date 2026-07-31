import React, { useEffect, useState } from 'react'
import { Box, CircularProgress, Tab, Tabs, Typography } from '@mui/material'
import {
  Calculate as CalcIcon,
  Tungsten as LightIcon,
  Analytics as QualityIcon,
  CenterFocusStrong as CalibIcon,
  Palette as ColorIcon,
  FactCheck as ValidIcon,
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { fetchParameterGroups } from '@/services/api'
import { useCalcStore } from '@/stores/calculationStore'
import Toolbar from '@/components/Toolbar'
import ParameterPanel from '@/components/ParameterPanel'
import WorkspacePanel from '@/components/WorkspacePanel'
import DetailsPanel from '@/components/DetailsPanel'
import LogPanel from '@/components/LogPanel'
import LightingCalibration from '@/components/LightingCalibration'
import ImageQuality from '@/components/ImageQuality'
import GeometricCalibration from '@/components/GeometricCalibration'
import ColorCalibration from '@/components/ColorCalibration'
import ValidationModule from '@/components/ValidationModule'

const ResizeHandle: React.FC = () => (
  <PanelResizeHandle>
    <Box
      sx={{
        width: 4,
        height: '100%',
        background: 'transparent',
        cursor: 'col-resize',
        '&:hover': { background: 'rgba(59,130,246,0.4)' },
        transition: 'background 0.15s',
      }}
    />
  </PanelResizeHandle>
)

const HResizeHandle: React.FC = () => (
  <PanelResizeHandle>
    <Box
      sx={{
        width: '100%',
        height: 4,
        background: 'transparent',
        cursor: 'row-resize',
        '&:hover': { background: 'rgba(59,130,246,0.4)' },
        transition: 'background 0.15s',
      }}
    />
  </PanelResizeHandle>
)

const App: React.FC = () => {
  const setParameterGroups = useCalcStore(s => s.setParameterGroups)
  const [module, setModule] = useState<'calculator' | 'lighting' | 'quality' | 'geocal' | 'color' | 'validation'>('calculator')

  const { data: groups, isLoading, error } = useQuery({
    queryKey: ['parameter-groups'],
    queryFn: fetchParameterGroups,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (groups) setParameterGroups(groups)
  }, [groups, setParameterGroups])

  if (isLoading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading Machine Vision Calculator…
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Typography color="error">
          Failed to load parameter definitions. Is the backend running on port 9999?
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {/* Module navigation bar */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tabs
          value={module}
          onChange={(_, v) => setModule(v)}
          sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, fontSize: '0.78rem', py: 0.5 } }}
        >
          <Tab value="calculator" label="Calculator"           icon={<CalcIcon   sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab value="lighting"   label="Lighting Calib."     icon={<LightIcon  sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab value="quality"    label="Image Quality"       icon={<QualityIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab value="geocal"     label="Geometric Calib."   icon={<CalibIcon  sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab value="color"      label="Color Calib."       icon={<ColorIcon  sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab value="validation" label="Validation"         icon={<ValidIcon  sx={{ fontSize: 16 }} />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Calculator module */}
      {module === 'calculator' && (
        <>
          <Toolbar />
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <PanelGroup direction="vertical" style={{ flex: 1 }}>
              <Panel defaultSize={80} minSize={50}>
                <PanelGroup direction="horizontal" style={{ height: '100%' }}>
                  <Panel defaultSize={20} minSize={14} maxSize={30}>
                    <ParameterPanel />
                  </Panel>
                  <ResizeHandle />
                  <Panel defaultSize={55} minSize={35}>
                    <WorkspacePanel />
                  </Panel>
                  <ResizeHandle />
                  <Panel defaultSize={25} minSize={18} maxSize={40}>
                    <DetailsPanel />
                  </Panel>
                </PanelGroup>
              </Panel>
              <HResizeHandle />
              <Panel defaultSize={20} minSize={8} maxSize={40}>
                <LogPanel />
              </Panel>
            </PanelGroup>
          </Box>
        </>
      )}

      {/* Lighting calibration module */}
      {module === 'lighting' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <LightingCalibration />
        </Box>
      )}

      {/* Image quality module */}
      {module === 'quality' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <ImageQuality />
        </Box>
      )}

      {/* Geometric calibration module */}
      {module === 'geocal' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <GeometricCalibration />
        </Box>
      )}

      {/* Color calibration module */}
      {module === 'color' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <ColorCalibration />
        </Box>
      )}

      {/* Vision performance validation module */}
      {module === 'validation' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <ValidationModule />
        </Box>
      )}
    </Box>
  )
}

export default App
