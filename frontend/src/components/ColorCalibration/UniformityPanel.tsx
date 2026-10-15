import React from 'react'
import { Box, Chip, Grid, Stack, Typography } from '@mui/material'
import type { ColorCalibrationResult } from '@/types/colorCalibration'
import HeatmapCanvas from '@/components/common/HeatmapCanvas'
import { GRADE_COLORS, statusColor } from '@/theme/status'

interface Props { result: ColorCalibrationResult }

const UniformityPanel: React.FC<Props> = ({ result: { uniformity: uni } }) => {
  const gradeColor = statusColor(GRADE_COLORS, uni.status)

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">Color Uniformity</Typography>
        <Chip label={uni.status.toUpperCase()} size="small"
          sx={{ bgcolor: gradeColor + '22', color: gradeColor, fontWeight: 700 }} />
      </Stack>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: 'Spatial Uniformity',      value: `${uni.spatial_uniformity_pct.toFixed(2)} %`, color: gradeColor },
          { label: 'Illumination Uniformity', value: `${uni.illumination_uniformity_pct.toFixed(2)} %`, color: '#9CA3AF' },
          { label: 'Max Variation',           value: `${uni.max_variation_pct.toFixed(2)} %`,           color: '#9CA3AF' },
        ].map(m => (
          <Grid item xs={4} key={m.label}>
            <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">{m.label}</Typography>
              <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700, color: m.color }}>{m.value}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        Brightness Uniformity Heatmap ({uni.heatmap_cols}×{uni.heatmap_rows} grid)
      </Typography>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <HeatmapCanvas data={uni.heatmap} rows={uni.heatmap_rows} cols={uni.heatmap_cols} width={320} height={220} />
        <Typography variant="caption" color="text.disabled" sx={{ pt: 1 }}>
          Blue = darker regions<br />Red = brighter regions<br />Ideal: uniform yellow/green<br /><br />
          Grid: {uni.heatmap_cols}×{uni.heatmap_rows} cells
        </Typography>
      </Stack>
    </Box>
  )
}

export default UniformityPanel
