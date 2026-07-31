import React, { useState } from 'react'
import {
  Alert, Box, Chip, Collapse, IconButton,
  LinearProgress, Stack, Tab, Tabs, Tooltip, Typography,
} from '@mui/material'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import ValidationInput      from './ValidationInput'
import DashboardPanel       from './DashboardPanel'
import RepeatabilityPanel   from './RepeatabilityPanel'
import AIPanel              from './AIPanel'
import OCRPanel             from './OCRPanel'
import RuntimePanel         from './RuntimePanel'
import StabilityPanel       from './StabilityPanel'
import GRRPanel             from './GRRPanel'
import ValidationReportPanel from './ReportPanel'
import { runValidation }    from '@/services/validationApi'
import type { ValidationRequest, ValidationResult } from '@/types/validation'

const VERDICT_COLOR: Record<string, string> = {
  'PASS': '#10B981', 'CONDITIONAL PASS': '#F59E0B', 'FAIL': '#EF4444',
}

const ValidationModule: React.FC = () => {
  const [result,    setResult]    = useState<ValidationResult | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [tab,       setTab]       = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  const handleRun = async (req: ValidationRequest) => {
    setLoading(true); setError(null)
    try {
      const res = await runValidation(req)
      setResult(res)
      setCollapsed(true)
      setTab(0)
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Validation failed.')
    } finally {
      setLoading(false)
    }
  }

  const availableTabs = result ? [
    'Dashboard',
    result.repeatability && 'Repeatability',
    result.grr           && 'GR&R',
    result.ai            && 'AI Performance',
    result.ocr           && 'OCR',
    result.runtime       && 'Runtime',
    result.stability     && 'Stability',
    'Report',
  ].filter(Boolean) as string[] : []

  const vc = result ? VERDICT_COLOR[result.final_score.verdict] ?? '#9CA3AF' : '#9CA3AF'

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stack direction="row" alignItems="center" sx={{ px: 2, py: 0.5 }}>
          <Typography variant="subtitle2" sx={{ flex: 1 }}>Vision Performance Validation</Typography>
          {result && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={result.final_score.verdict}
                size="small"
                sx={{ bgcolor: vc + '22', color: vc, fontWeight: 800 }}
              />
              <Chip
                label={`${result.final_score.overall_score.toFixed(1)}/100`}
                size="small" variant="outlined"
              />
            </Stack>
          )}
          <Tooltip title={collapsed ? 'Expand input' : 'Collapse input'}>
            <IconButton size="small" onClick={() => setCollapsed(c => !c)}>
              {collapsed ? <ExpandMore /> : <ExpandLess />}
            </IconButton>
          </Tooltip>
        </Stack>

        <Collapse in={!collapsed}>
          <ValidationInput onRun={handleRun} isLoading={loading} />
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
              '& .MuiTab-root': { minHeight: 38, fontSize: '0.73rem', py: 0.5 } }}
          >
            {availableTabs.map((label, i) => <Tab key={i} label={label} />)}
          </Tabs>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {availableTabs[tab] === 'Dashboard'    && <DashboardPanel       result={result} />}
            {availableTabs[tab] === 'Repeatability'&& <RepeatabilityPanel   result={result} />}
            {availableTabs[tab] === 'GR&R'         && <GRRPanel             result={result} />}
            {availableTabs[tab] === 'AI Performance'&& <AIPanel             result={result} />}
            {availableTabs[tab] === 'OCR'          && <OCRPanel             result={result} />}
            {availableTabs[tab] === 'Runtime'      && <RuntimePanel         result={result} />}
            {availableTabs[tab] === 'Stability'    && <StabilityPanel       result={result} />}
            {availableTabs[tab] === 'Report'       && <ValidationReportPanel result={result} />}
          </Box>
        </Box>
      ) : (
        !loading && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
            <Typography color="text.secondary" variant="body2">
              Enter validation data in the form above and click Run Validation.
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Click "Load Sample" to quickly populate all fields with demo data.
            </Typography>
          </Box>
        )
      )}
    </Box>
  )
}

export default ValidationModule
