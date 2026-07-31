import React from 'react'
import { Box, Card, CardContent, Chip, Grid, Stack, Tooltip, Typography } from '@mui/material'
import type { GeometricCalibrationResult } from '@/types/geometricCalibration'

interface Props { result: GeometricCalibrationResult }

const VAL = ({ label, value, unit = '' }: { label: string; value: string | number; unit?: string }) => (
  <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
    <CardContent sx={{ p: '12px 16px !important' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
        {typeof value === 'number' ? value.toFixed(4) : value}
        {unit && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>{unit}</Typography>}
      </Typography>
    </CardContent>
  </Card>
)

const IntrinsicPanel: React.FC<Props> = ({ result: { intrinsic, image_width, image_height } }) => {
  const K = intrinsic.camera_matrix
  const labels = ['fx', '0', 'cx', '0', 'fy', 'cy', '0', '0', '1']
  const flatK   = K.flat()

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Intrinsic Parameters — {image_width}×{image_height} px
      </Typography>

      {/* Key metrics */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: 'Focal length X (fx)', value: intrinsic.fx, unit: 'px' },
          { label: 'Focal length Y (fy)', value: intrinsic.fy, unit: 'px' },
          { label: 'Principal Point X (cx)', value: intrinsic.cx, unit: 'px' },
          { label: 'Principal Point Y (cy)', value: intrinsic.cy, unit: 'px' },
          { label: 'Aspect Ratio (fy/fx)', value: intrinsic.aspect_ratio, unit: '' },
        ].map(m => (
          <Grid item xs={6} sm={4} md={2.4} key={m.label}>
            <VAL label={m.label} value={m.value} unit={m.unit} />
          </Grid>
        ))}
      </Grid>

      {/* Principal point position indicator */}
      <Stack direction="row" spacing={3} alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Principal point position (relative to image center)
          </Typography>
          <Box
            sx={{
              position: 'relative', width: 200, height: 120,
              border: '1px solid', borderColor: 'divider',
              borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)',
              overflow: 'hidden',
            }}
          >
            {/* Center crosshair */}
            <Box sx={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, bgcolor: 'rgba(255,255,255,0.15)', transform: 'translateX(-0.5px)' }} />
            <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, bgcolor: 'rgba(255,255,255,0.15)', transform: 'translateY(-0.5px)' }} />
            {/* Principal point */}
            <Tooltip title={`cx=${intrinsic.cx.toFixed(1)}  cy=${intrinsic.cy.toFixed(1)}`}>
              <Box
                sx={{
                  position: 'absolute',
                  left: `${(intrinsic.cx / image_width) * 100}%`,
                  top:  `${(intrinsic.cy / image_height) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 10, height: 10,
                  borderRadius: '50%', bgcolor: '#F59E0B',
                  boxShadow: '0 0 6px #F59E0B',
                  cursor: 'pointer',
                }}
              />
            </Tooltip>
          </Box>
          <Typography variant="caption" color="text.disabled">
            Orange dot = principal point; lines = image center
          </Typography>
        </Box>
      </Stack>

      {/* Camera matrix */}
      <Typography variant="body2" color="text.secondary" gutterBottom>Camera Matrix K (3×3)</Typography>
      <Box
        sx={{
          display: 'inline-grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0.5,
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1.5,
          bgcolor: 'rgba(0,0,0,0.3)',
        }}
      >
        {flatK.map((v, i) => (
          <Box
            key={i}
            sx={{
              px: 1.5, py: 0.5, textAlign: 'right', minWidth: 110,
              bgcolor: labels[i] !== '0' && labels[i] !== '1' ? 'rgba(59,130,246,0.12)' : 'transparent',
              borderRadius: 0.5,
            }}
          >
            <Typography component="span" variant="caption" color="text.disabled" sx={{ mr: 0.5 }}>
              {labels[i]}=
            </Typography>
            {v.toFixed(4)}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default IntrinsicPanel
