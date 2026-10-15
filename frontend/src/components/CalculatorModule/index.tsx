import React from 'react'
import { Box } from '@mui/material'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import Toolbar from '@/components/Toolbar'
import ParameterPanel from '@/components/ParameterPanel'
import WorkspacePanel from '@/components/WorkspacePanel'
import DetailsPanel from '@/components/DetailsPanel'
import LogPanel from '@/components/LogPanel'

const ResizeHandle: React.FC<{ direction: 'horizontal' | 'vertical' }> = ({ direction }) => {
  const horizontal = direction === 'horizontal'
  return (
    <PanelResizeHandle>
      <Box
        sx={{
          width: horizontal ? 4 : '100%',
          height: horizontal ? '100%' : 4,
          background: 'transparent',
          cursor: horizontal ? 'col-resize' : 'row-resize',
          '&:hover': { background: 'rgba(59,130,246,0.4)' },
          transition: 'background 0.15s',
        }}
      />
    </PanelResizeHandle>
  )
}

/** Parameter calculator: parameter tree | workspace | formula details, with log below. */
const CalculatorModule: React.FC = () => (
  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    <Toolbar />
    <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <PanelGroup direction="vertical" style={{ flex: 1 }}>
        <Panel defaultSize={80} minSize={50}>
          <PanelGroup direction="horizontal" style={{ height: '100%' }}>
            <Panel defaultSize={20} minSize={14} maxSize={30}>
              <ParameterPanel />
            </Panel>
            <ResizeHandle direction="horizontal" />
            <Panel defaultSize={55} minSize={35}>
              <WorkspacePanel />
            </Panel>
            <ResizeHandle direction="horizontal" />
            <Panel defaultSize={25} minSize={18} maxSize={40}>
              <DetailsPanel />
            </Panel>
          </PanelGroup>
        </Panel>
        <ResizeHandle direction="vertical" />
        <Panel defaultSize={20} minSize={8} maxSize={40}>
          <LogPanel />
        </Panel>
      </PanelGroup>
    </Box>
  </Box>
)

export default CalculatorModule
