import React from 'react'
import { Box, Grid, Stack, Typography } from '@mui/material'
import type { GeometricCalibrationResult } from '@/types/geometricCalibration'

interface Props { result: GeometricCalibrationResult }

const PerspectivePanel: React.FC<Props> = ({ result: { perspective } }) => {
  const H = perspective.homography_matrix

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Perspective &amp; Homography
      </Typography>
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 2 }}>
        Homography estimated from first calibration image (object plane → image plane)
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Scale X',        value: perspective.scale_x.toFixed(4),     unit: 'px/unit' },
          { label: 'Scale Y',        value: perspective.scale_y.toFixed(4),     unit: 'px/unit' },
          { label: 'Rotation',       value: `${perspective.rotation_deg.toFixed(3)}°`, unit: '' },
        ].map(m => (
          <Grid item xs={12} sm={4} key={m.label}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)' }}>
              <Typography variant="caption" color="text.secondary" display="block">{m.label}</Typography>
              <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                {m.value}
                {m.unit && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>{m.unit}</Typography>}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Homography 3×3 */}
      <Typography variant="body2" color="text.secondary" gutterBottom>Homography Matrix H (3×3)</Typography>
      <Box
        sx={{
          display: 'inline-grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0.5, fontFamily: 'monospace', fontSize: '0.8rem',
          border: '1px solid', borderColor: 'divider', borderRadius: 1,
          p: 1.5, bgcolor: 'rgba(0,0,0,0.3)',
        }}
      >
        {H.flat().map((v, i) => (
          <Box key={i} sx={{ px: 1.5, py: 0.5, textAlign: 'right', minWidth: 100 }}>
            {v.toFixed(6)}
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.disabled">
          The homography H maps 2D board coordinates to pixel coordinates in the image.<br />
          It encodes scale, rotation, and perspective effects of the camera-board geometry.
        </Typography>
      </Box>
    </Box>
  )
}

export default PerspectivePanel
