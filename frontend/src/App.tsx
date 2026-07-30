import React, { useEffect } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { fetchParameterGroups } from '@/services/api'
import { useCalcStore } from '@/stores/calculationStore'
import Toolbar from '@/components/Toolbar'
import ParameterPanel from '@/components/ParameterPanel'
import WorkspacePanel from '@/components/WorkspacePanel'
import DetailsPanel from '@/components/DetailsPanel'
import LogPanel from '@/components/LogPanel'

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
      {/* Top toolbar */}
      <Toolbar />

      {/* Main content area */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <PanelGroup direction="vertical" style={{ flex: 1 }}>
          {/* Three-panel workspace */}
          <Panel defaultSize={80} minSize={50}>
            <PanelGroup direction="horizontal" style={{ height: '100%' }}>
              {/* Left: parameter categories */}
              <Panel defaultSize={20} minSize={14} maxSize={30}>
                <ParameterPanel />
              </Panel>

              <ResizeHandle />

              {/* Center: workspace */}
              <Panel defaultSize={55} minSize={35}>
                <WorkspacePanel />
              </Panel>

              <ResizeHandle />

              {/* Right: details */}
              <Panel defaultSize={25} minSize={18} maxSize={40}>
                <DetailsPanel />
              </Panel>
            </PanelGroup>
          </Panel>

          <HResizeHandle />

          {/* Bottom: log panel */}
          <Panel defaultSize={20} minSize={8} maxSize={40}>
            <LogPanel />
          </Panel>
        </PanelGroup>
      </Box>
    </Box>
  )
}

export default App
