import React, { useEffect, useState } from 'react'
import { Box, CircularProgress, Tab, Tabs, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { fetchParameterGroups } from '@/services/api'
import { useCalcStore } from '@/stores/calculationStore'
import { MODULES } from '@/modules'

const App: React.FC = () => {
  const setParameterGroups = useCalcStore(s => s.setParameterGroups)
  const [moduleId, setModuleId] = useState(MODULES[0].id)

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

  const ActiveModule = (MODULES.find(m => m.id === moduleId) ?? MODULES[0]).Component

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
          value={moduleId}
          onChange={(_, v) => setModuleId(v)}
          sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, fontSize: '0.78rem', py: 0.5 } }}
        >
          {MODULES.map(({ id, label, Icon }) => (
            <Tab key={id} value={id} label={label} icon={<Icon sx={{ fontSize: 16 }} />} iconPosition="start" />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <ActiveModule />
      </Box>
    </Box>
  )
}

export default App
