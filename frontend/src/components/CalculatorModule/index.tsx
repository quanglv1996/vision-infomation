import React, { useEffect, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import {
  AutoAwesome as GuidedIcon,
  Tune as AdvancedIcon,
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import Toolbar from '@/components/Toolbar'
import ParameterPanel from '@/components/ParameterPanel'
import WorkspacePanel from '@/components/WorkspacePanel'
import DetailsPanel from '@/components/DetailsPanel'
import LogPanel from '@/components/LogPanel'
import ScenarioView from '@/components/Scenarios'
import { fetchParameterGroups } from '@/services/api'
import { useCalcStore } from '@/stores/calculationStore'
import { useNavStore } from '@/stores/navStore'

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

/** Free-form calculator: parameter tree | workspace | formula details, with log below. */
const AdvancedView: React.FC = () => (
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

type View = 'guided' | 'advanced'

/** System-design calculator: guided vision problems, or the free-form parameter workspace. */
const CalculatorModule: React.FC = () => {
  const [view, setView] = useState<View>('guided')
  const setParameterGroups = useCalcStore(s => s.setParameterGroups)
  const requestedScenario = useNavStore(s => s.scenarioId)

  const { data: groups, isLoading, error, refetch } = useQuery({
    queryKey: ['parameter-groups'],
    queryFn: fetchParameterGroups,
    staleTime: Infinity,
  })

  useEffect(() => { if (groups) setParameterGroups(groups) }, [groups, setParameterGroups])
  useEffect(() => { if (requestedScenario) setView('guided') }, [requestedScenario])

  let body: React.ReactNode
  if (isLoading) {
    body = (
      <Stack alignItems="center" justifyContent="center" gap={2} sx={{ height: '100%' }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">Đang tải danh mục thông số…</Typography>
      </Stack>
    )
  } else if (error || !groups) {
    body = (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', p: 4 }}>
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={() => refetch()}>Thử lại</Button>}
          sx={{ maxWidth: 560 }}
        >
          Không tải được định nghĩa thông số. Backend có đang chạy ở cổng 9999 không?
          Mục Tài liệu vẫn dùng được khi không có backend.
        </Alert>
      </Stack>
    )
  } else {
    // Both stay mounted so switching views keeps the user's inputs.
    body = (
      <>
        <Box sx={{ height: '100%', display: view === 'guided' ? 'block' : 'none' }}>
          <ScenarioView groups={groups} onOpenAdvanced={() => setView('advanced')} />
        </Box>
        <Box sx={{ height: '100%', display: view === 'advanced' ? 'block' : 'none' }}>
          <AdvancedView />
        </Box>
      </>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stack
        direction="row" alignItems="center" gap={2}
        sx={{ px: 2.5, height: 52, flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.98rem', lineHeight: 1.2 }}>Thiết kế hệ vision</Typography>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Chọn camera, lens, chiếu sáng theo bài toán</Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, v: View | null) => v && setView(v)}>
          <ToggleButton value="guided" sx={{ px: 1.5, gap: 0.75, fontSize: '0.78rem' }}>
            <GuidedIcon sx={{ fontSize: 16 }} /> Theo bài toán
          </ToggleButton>
          <ToggleButton value="advanced" sx={{ px: 1.5, gap: 0.75, fontSize: '0.78rem' }}>
            <AdvancedIcon sx={{ fontSize: 16 }} /> Nâng cao
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>{body}</Box>
    </Box>
  )
}

export default CalculatorModule
