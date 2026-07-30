import React, { useState } from 'react'
import {
  Box,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { useCalcStore } from '@/stores/calculationStore'
import ParameterCard from './ParameterCard'
import DependencyGraph from '@/components/DependencyGraph'
import RecommendationPanel from '@/components/RecommendationPanel'

const WorkspacePanel: React.FC = () => {
  const { parameterGroups, params, activeTab, setActiveTab } = useCalcStore()

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Tab bar */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: '0.78rem' },
          }}
        >
          <Tab label="Parameters" value="parameters" />
          <Tab label="Dependency Graph" value="graph" />
          <Tab label="Recommendations" value="recommendations" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'parameters' && (
          <Box sx={{ height: '100%', overflowY: 'auto', p: 2 }}>
            {parameterGroups.map(group => (
              <Box key={group.category} mb={3}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mb: 1,
                    color: 'text.secondary',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  {group.category}
                </Typography>
                <Grid container spacing={1}>
                  {group.parameters.map(param => {
                    const state = params[param.id] ?? {
                      id: param.id,
                      value: null,
                      status: 'unknown' as const,
                      isTarget: false,
                    }
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={param.id}>
                        <ParameterCard param={param} state={state} />
                      </Grid>
                    )
                  })}
                </Grid>
              </Box>
            ))}
          </Box>
        )}

        {activeTab === 'graph' && <DependencyGraph />}

        {activeTab === 'recommendations' && <RecommendationPanel />}
      </Box>
    </Box>
  )
}

export default WorkspacePanel
