import React from 'react'
import { Alert, Box, Button, Divider, Stack, Typography } from '@mui/material'
import { Download as DlIcon } from '@mui/icons-material'
import type { ValidationResult } from '@/types/validation'

interface Props { result: ValidationResult }

const dl = (content: string, name: string, mime: string) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type: mime }))
  a.download = name; a.click(); URL.revokeObjectURL(a.href)
}

const ValidationReportPanel: React.FC<Props> = ({ result }) => {
  const fs = result.final_score
  const vc = fs.verdict === 'PASS' ? '#10B981' : fs.verdict === 'CONDITIONAL PASS' ? '#F59E0B' : '#EF4444'

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">Validation Report &amp; Export</Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<DlIcon />} variant="outlined"
            onClick={() => dl(result.export_json, 'validation_report.json', 'application/json')}>
            JSON
          </Button>
          <Button size="small" startIcon={<DlIcon />} variant="outlined"
            onClick={() => dl(result.export_csv, 'validation_report.csv', 'text/csv')}>
            CSV
          </Button>
        </Stack>
      </Stack>

      {/* Summary */}
      <Box sx={{ p: 2, border: `1px solid ${vc}55`, borderRadius: 1, bgcolor: vc + '08', mb: 2, fontFamily: 'monospace', fontSize: '0.78rem' }}>
        <Typography sx={{ color: vc, fontWeight: 900, mb: 0.5, fontFamily: 'inherit' }}>
          [{fs.verdict}] {result.system_name} — Score: {fs.overall_score.toFixed(1)} / 100
        </Typography>
        {Object.entries(fs.component_scores).filter(([,v]) => v.available).map(([k, v]) => (
          <Box key={k} sx={{ display: 'flex', gap: 1, mb: 0.3 }}>
            <Box sx={{ color: '#9CA3AF', minWidth: 160 }}>{k}:</Box>
            <Box sx={{ color: '#E5E7EB' }}>{v.score.toFixed(1)} / 100</Box>
          </Box>
        ))}
      </Box>

      {/* Module details */}
      <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(0,0,0,0.3)', mb: 2, fontFamily: 'monospace', fontSize: '0.78rem', maxHeight: 240, overflowY: 'auto' }}>
        {result.repeatability && (
          <>
            <Box sx={{ color: '#60A5FA', mb: 0.3 }}>─── Repeatability ───</Box>
            {[['Mean', result.repeatability.mean], ['Std', result.repeatability.std],
              ['Cp', result.repeatability.cp], ['Cpk', result.repeatability.cpk]].map(([k,v]) => (
              <Box key={String(k)} sx={{ display: 'flex', gap: 1 }}>
                <Box sx={{ color: '#9CA3AF', minWidth: 60 }}>{k}:</Box>
                <Box sx={{ color: '#E5E7EB' }}>{v != null ? Number(v).toFixed(4) : '—'}</Box>
              </Box>
            ))}
          </>
        )}
        {result.ai && (
          <>
            <Box sx={{ color: '#60A5FA', mt: 0.5, mb: 0.3 }}>─── AI Performance ───</Box>
            {[['F1', result.ai.f1_score], ['Accuracy', result.ai.accuracy], ['AUC', result.ai.roc_auc]].map(([k,v]) => (
              <Box key={String(k)} sx={{ display: 'flex', gap: 1 }}>
                <Box sx={{ color: '#9CA3AF', minWidth: 60 }}>{k}:</Box>
                <Box sx={{ color: '#E5E7EB' }}>{v != null ? Number(v).toFixed(4) : '—'}</Box>
              </Box>
            ))}
          </>
        )}
        {result.runtime && (
          <>
            <Box sx={{ color: '#60A5FA', mt: 0.5, mb: 0.3 }}>─── Runtime ───</Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box sx={{ color: '#9CA3AF', minWidth: 60 }}>FPS:</Box>
              <Box sx={{ color: '#E5E7EB' }}>{result.runtime.fps.toFixed(1)}</Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box sx={{ color: '#9CA3AF', minWidth: 60 }}>P99 ms:</Box>
              <Box sx={{ color: '#E5E7EB' }}>{result.runtime.p99_ms.toFixed(2)}</Box>
            </Box>
          </>
        )}
        {result.stability && (
          <>
            <Box sx={{ color: '#60A5FA', mt: 0.5, mb: 0.3 }}>─── Stability ───</Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box sx={{ color: '#9CA3AF', minWidth: 80 }}>Pass Rate:</Box>
              <Box sx={{ color: '#E5E7EB' }}>{result.stability.pass_rate_pct.toFixed(3)} %</Box>
            </Box>
          </>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" color="text.secondary" gutterBottom>Recommendations</Typography>
      <Stack spacing={1}>
        {fs.recommendations.map((r, i) => (
          <Alert key={i} severity={r.includes('passes') || r.includes('approved') ? 'success' : 'warning'}
            sx={{ fontSize: '0.8rem', py: 0.5 }}>
            {r}
          </Alert>
        ))}
      </Stack>
    </Box>
  )
}

export default ValidationReportPanel
