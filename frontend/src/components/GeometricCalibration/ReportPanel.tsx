import React from 'react'
import {
  Alert, Box, Button, Divider, Stack, Typography,
} from '@mui/material'
import {
  Download as DlIcon,
  CheckCircle as OkIcon,
  Warning as WarnIcon,
} from '@mui/icons-material'
import type { GeometricCalibrationResult } from '@/types/geometricCalibration'

interface Props { result: GeometricCalibrationResult }

const download = (content: string, filename: string, mime: string) => {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const ReportPanel: React.FC<Props> = ({ result }) => {
  const { intrinsic, distortion, quality, recommendations, export_yaml, export_json, export_opencv_xml,
    pattern_type, board_cols, board_rows, square_size_mm, num_images_used, image_width, image_height } = result

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">Calibration Report &amp; Export</Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<DlIcon />} variant="outlined"
            onClick={() => download(export_yaml, 'calibration.yaml', 'text/yaml')}>
            YAML
          </Button>
          <Button size="small" startIcon={<DlIcon />} variant="outlined"
            onClick={() => download(export_json, 'calibration.json', 'application/json')}>
            JSON
          </Button>
          <Button size="small" startIcon={<DlIcon />} variant="outlined"
            onClick={() => download(export_opencv_xml, 'calibration.xml', 'application/xml')}>
            OpenCV XML
          </Button>
        </Stack>
      </Stack>

      {/* Summary */}
      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', mb: 2, fontFamily: 'monospace', fontSize: '0.78rem' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'inherit', display: 'block', mb: 1 }}>
          Calibration Summary
        </Typography>
        {[
          ['Pattern',         `${pattern_type}  (${board_cols}×${board_rows} inner corners, ${square_size_mm} mm squares)`],
          ['Images used',     `${num_images_used}`],
          ['Image size',      `${image_width}×${image_height} px`],
          ['RMS error',       `${quality.rms_error.toFixed(4)} px  [${quality.status}]`],
          ['Score',           `${quality.calibration_score.toFixed(1)} / 100`],
          ['fx / fy',         `${intrinsic.fx.toFixed(4)} / ${intrinsic.fy.toFixed(4)} px`],
          ['cx / cy',         `${intrinsic.cx.toFixed(4)} / ${intrinsic.cy.toFixed(4)} px`],
          ['k1 / k2 / k3',    `${distortion.k1.toFixed(6)} / ${distortion.k2.toFixed(6)} / ${distortion.k3.toFixed(6)}`],
          ['p1 / p2',         `${distortion.p1.toFixed(6)} / ${distortion.p2.toFixed(6)}`],
          ['Max distortion',  `${distortion.max_distortion_px.toFixed(2)} px`],
        ].map(([k, v]) => (
          <Box key={k} sx={{ display: 'flex', gap: 1, mb: 0.3 }}>
            <Box sx={{ color: '#9CA3AF', minWidth: 160 }}>{k}:</Box>
            <Box sx={{ color: '#E5E7EB' }}>{v}</Box>
          </Box>
        ))}
      </Box>

      {/* YAML preview */}
      <Typography variant="body2" color="text.secondary" gutterBottom>OpenCV YAML Preview</Typography>
      <Box
        component="pre"
        sx={{
          p: 1.5, mb: 2, borderRadius: 1,
          bgcolor: 'rgba(0,0,0,0.5)', border: '1px solid', borderColor: 'divider',
          fontSize: '0.72rem', fontFamily: 'monospace',
          overflowX: 'auto', maxHeight: 200, lineHeight: 1.6,
          color: '#D1FAE5',
        }}
      >
        {export_yaml}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Recommendations */}
      <Typography variant="body2" color="text.secondary" gutterBottom>Recommendations</Typography>
      <Stack spacing={1}>
        {recommendations.map((rec, i) => (
          <Alert
            key={i}
            severity={rec.startsWith('Excellent') || rec.startsWith('Calibration complete') ? 'success' : 'warning'}
            icon={rec.startsWith('Excellent') ? <OkIcon /> : <WarnIcon />}
            sx={{ fontSize: '0.8rem', py: 0.5 }}
          >
            {rec}
          </Alert>
        ))}
      </Stack>
    </Box>
  )
}

export default ReportPanel
