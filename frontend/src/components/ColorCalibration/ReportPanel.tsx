import React from 'react'
import { Alert, Box, Button, Divider, Stack, Typography } from '@mui/material'
import { Download as DlIcon } from '@mui/icons-material'
import type { ColorCalibrationResult } from '@/types/colorCalibration'

interface Props { result: ColorCalibrationResult }

const dl = (content: string, name: string, mime: string) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type: mime }))
  a.download = name; a.click()
  URL.revokeObjectURL(a.href)
}

const ColorReportPanel: React.FC<Props> = ({ result }) => {
  const { white_balance: wb, gray_balance: gb, gamma, uniformity: uni,
    white_point: wp, color_checker: cc, recommendations,
    export_json, export_csv, image_type, image_width, image_height } = result

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">Color Report &amp; Export</Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<DlIcon />} variant="outlined"
            onClick={() => dl(export_json, 'color_calibration.json', 'application/json')}>
            JSON
          </Button>
          <Button size="small" startIcon={<DlIcon />} variant="outlined"
            onClick={() => dl(export_csv, 'color_calibration.csv', 'text/csv')}>
            CSV
          </Button>
        </Stack>
      </Stack>

      {/* Summary table */}
      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(0,0,0,0.3)', mb: 2, fontFamily: 'monospace', fontSize: '0.78rem' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'inherit', display: 'block', mb: 1 }}>
          Summary — {image_type.replace('_', ' ')} · {image_width}×{image_height} px
        </Typography>
        {[
          ['White Balance Score',   `${wb.wb_score.toFixed(1)} / 100  [${wb.status}]`],
          ['R / B Gain',            `${wb.r_gain.toFixed(4)} / ${wb.b_gain.toFixed(4)}`],
          ['Color Temperature',     `${wb.color_temperature_k.toFixed(0)} K`],
          ['Tint',                  `${wb.tint > 0 ? '+' : ''}${wb.tint.toFixed(1)}`],
          ['Neutrality Error',      `${gb.neutrality_error_pct.toFixed(2)} %  [${gb.status}]`],
          ['Gamma',                 `${gamma.estimated_gamma.toFixed(3)} (recommended ${gamma.recommended_gamma})`],
          ['Spatial Uniformity',    `${uni.spatial_uniformity_pct.toFixed(2)} %  [${uni.status}]`],
          ['Illuminant',            `${wp.illuminant}  (${wp.color_temperature_k.toFixed(0)} K)`],
          ...(cc ? [
            ['ColorChecker ΔE2000 mean', `${cc.mean_delta_e_2000.toFixed(3)}`],
            ['Color Accuracy Score',     `${cc.accuracy_score.toFixed(1)} / 100`],
            ['Pass / Warn / Fail',       `${cc.pass_count} / ${cc.warning_count} / ${cc.fail_count}`],
          ] : []),
        ].map(([k, v]) => (
          <Box key={k} sx={{ display: 'flex', gap: 1, mb: 0.3 }}>
            <Box sx={{ color: '#9CA3AF', minWidth: 200 }}>{k}:</Box>
            <Box sx={{ color: '#E5E7EB' }}>{v}</Box>
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="body2" color="text.secondary" gutterBottom>Recommendations</Typography>
      <Stack spacing={1}>
        {recommendations.map((rec, i) => (
          <Alert
            key={i}
            severity={rec.startsWith('Color') || rec.startsWith('Excellent') ? 'success' : 'warning'}
            sx={{ fontSize: '0.8rem', py: 0.5 }}
          >
            {rec}
          </Alert>
        ))}
      </Stack>
    </Box>
  )
}

export default ColorReportPanel
