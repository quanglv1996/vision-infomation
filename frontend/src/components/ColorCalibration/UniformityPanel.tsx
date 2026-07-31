import React, { useRef, useEffect } from 'react'
import { Box, Chip, Grid, Stack, Typography } from '@mui/material'
import type { ColorCalibrationResult } from '@/types/colorCalibration'

interface Props { result: ColorCalibrationResult }

function jetColor(t: number): [number, number, number] {
  const c = (v: number) => Math.max(0, Math.min(1, v))
  return [
    Math.round(c(1.5 - Math.abs(4*t - 3)) * 255),
    Math.round(c(1.5 - Math.abs(4*t - 2)) * 255),
    Math.round(c(1.5 - Math.abs(4*t - 1)) * 255),
  ]
}

const HeatmapCanvas: React.FC<{ data: number[][]; rows: number; cols: number; w?: number; h?: number }> = ({ data, rows, cols, w = 320, h = 220 }) => {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !data.length) return
    const ctx = canvas.getContext('2d')!
    let mn = Infinity, mx = -Infinity
    for (const row of data) for (const v of row) { if (v < mn) mn = v; if (v > mx) mx = v }
    const range = mx - mn || 1
    const img = ctx.createImageData(cols, rows)
    let idx = 0
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const [R, G, B] = jetColor(((data[r]?.[c] ?? 0) - mn) / range)
        img.data[idx++] = R; img.data[idx++] = G; img.data[idx++] = B; img.data[idx++] = 255
      }
    const tmp = document.createElement('canvas')
    tmp.width = cols; tmp.height = rows
    tmp.getContext('2d')!.putImageData(img, 0, 0)
    canvas.width = w; canvas.height = h
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(tmp, 0, 0, w, h)
  }, [data, rows, cols, w, h])
  return <canvas ref={ref} style={{ display: 'block', borderRadius: 4 }} />
}

const UniformityPanel: React.FC<Props> = ({ result: { uniformity: uni } }) => {
  const statusColor = { excellent: '#10B981', good: '#3B82F6', acceptable: '#F59E0B', poor: '#EF4444' }[uni.status] ?? '#9CA3AF'

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">Color Uniformity</Typography>
        <Chip label={uni.status.toUpperCase()} size="small"
          sx={{ bgcolor: statusColor + '22', color: statusColor, fontWeight: 700 }} />
      </Stack>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: 'Spatial Uniformity',      value: `${uni.spatial_uniformity_pct.toFixed(2)} %`, color: statusColor },
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
        <HeatmapCanvas data={uni.heatmap} rows={uni.heatmap_rows} cols={uni.heatmap_cols} />
        <Typography variant="caption" color="text.disabled" sx={{ pt: 1 }}>
          Blue = darker regions<br />Red = brighter regions<br />Ideal: uniform yellow/green<br /><br />
          Grid: {uni.heatmap_cols}×{uni.heatmap_rows} cells
        </Typography>
      </Stack>
    </Box>
  )
}

export default UniformityPanel
