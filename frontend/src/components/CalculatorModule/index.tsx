import React, { useEffect, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import {
  AutoAwesome as GuidedIcon,
  Calculate as CalcIcon,
  Tune as AdvancedIcon,
} from '@mui/icons-material'
import ModuleHeader from '@/components/common/ModuleHeader'
import FreeFormView from '@/components/FreeForm'
import ScenarioView from '@/components/Scenarios'
import { SCENARIOS } from '@/components/Scenarios/scenarios'
import { useParameters } from '@/hooks/useParameters'
import { useConfigStore } from '@/stores/configStore'
import { useNavStore } from '@/stores/navStore'
import { ACCENT } from '@/theme/theme'

type View = 'guided' | 'advanced'

/** System-design calculator: guided vision problems, or free-form parameter inference. */
const CalculatorModule: React.FC = () => {
  const [view, setView] = useState<View>('guided')
  const requestedScenario = useNavStore(s => s.scenarioId)
  const pendingConfig = useConfigStore(s => s.pending)
  const { groups, paramById, isLoading, error, refetch } = useParameters()

  useEffect(() => { if (requestedScenario) setView('guided') }, [requestedScenario])
  useEffect(() => {
    if (!pendingConfig) return
    const guided = !!pendingConfig.scenario_id && SCENARIOS.some(s => s.id === pendingConfig.scenario_id)
    setView(guided ? 'guided' : 'advanced')
  }, [pendingConfig])

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
          <FreeFormView groups={groups} paramById={paramById} />
        </Box>
      </>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ModuleHeader title="Thiết kế hệ vision" subtitle="Chọn camera, lens, chiếu sáng theo bài toán" accent={ACCENT.blue} Icon={CalcIcon}>
        <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, v: View | null) => v && setView(v)}>
          <ToggleButton value="guided" title="Các bài toán điển hình với thông số gợi ý và kiểm tra đạt/không đạt" sx={{ px: 1.5, gap: 0.75, fontSize: '0.78rem' }}>
            <GuidedIcon sx={{ fontSize: 16 }} /> Theo bài toán
          </ToggleButton>
          <ToggleButton value="advanced" title="Nhập bất kỳ thông số nào, đặt mục tiêu, xem đồ thị phụ thuộc" sx={{ px: 1.5, gap: 0.75, fontSize: '0.78rem' }}>
            <AdvancedIcon sx={{ fontSize: 16 }} /> Nâng cao
          </ToggleButton>
        </ToggleButtonGroup>
      </ModuleHeader>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>{body}</Box>
    </Box>
  )
}

export default CalculatorModule
