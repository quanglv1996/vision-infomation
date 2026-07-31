import React, { useRef, useEffect } from 'react'
import { Box, Chip, Stack, Typography } from '@mui/material'
import type { GeometricCalibrationResult } from '@/types/geometricCalibration'

interface Props { result: GeometricCalibrationResult }

const LensVizCanvas: React.FC<{ lv: GeometricCalibrationResult['lens_viz']; w: number; h: number }> = ({ lv, w, h }) => {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0f1117'
    ctx.fillRect(0, 0, w, h)

    const scaleX = w / lv.image_width
    const scaleY = h / lv.image_height
    const n = lv.grid_n

    const toCanvasI = (xi: number, yi: number) => [xi * scaleX, yi * scaleY] as [number, number]
    const toCanvasD = (xd: number, yd: number) => [xd * scaleX, yd * scaleY] as [number, number]

    // Draw ideal grid (straight lines — green)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)'
    ctx.lineWidth = 1
    for (let row = 0; row < n; row++) {
      ctx.beginPath()
      for (let col = 0; col < n; col++) {
        const idx = row * n + col
        const [cx, cy] = toCanvasI(lv.grid_x_ideal[idx], lv.grid_y_ideal[idx])
        col === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy)
      }
      ctx.stroke()
    }
    for (let col = 0; col < n; col++) {
      ctx.beginPath()
      for (let row = 0; row < n; row++) {
        const idx = row * n + col
        const [cx, cy] = toCanvasI(lv.grid_x_ideal[idx], lv.grid_y_ideal[idx])
        row === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy)
      }
      ctx.stroke()
    }

    // Draw distorted grid (curved lines — orange/red)
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.85)'
    ctx.lineWidth = 1.2
    for (let row = 0; row < n; row++) {
      ctx.beginPath()
      for (let col = 0; col < n; col++) {
        const idx = row * n + col
        const [cx, cy] = toCanvasD(lv.grid_x_dist[idx], lv.grid_y_dist[idx])
        col === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy)
      }
      ctx.stroke()
    }
    for (let col = 0; col < n; col++) {
      ctx.beginPath()
      for (let row = 0; row < n; row++) {
        const idx = row * n + col
        const [cx, cy] = toCanvasD(lv.grid_x_dist[idx], lv.grid_y_dist[idx])
        row === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy)
      }
      ctx.stroke()
    }

    // Dot overlay at distorted positions
    lv.grid_x_dist.forEach((xd, idx) => {
      const [cx2, cy2] = toCanvasD(xd, lv.grid_y_dist[idx])
      const mag = lv.displacements[idx]
      const maxMag = Math.max(...lv.displacements, 1)
      const t = mag / maxMag
      const r = Math.round(255 * t)
      const g = Math.round(255 * (1 - t) * 0.5)
      ctx.beginPath()
      ctx.arc(cx2, cy2, 2, 0, Math.PI * 2)
      ctx.fillStyle = `rgb(${r},${g},60)`
      ctx.fill()
    })
  }, [lv, w, h])

  return <canvas ref={ref} style={{ display: 'block', borderRadius: 4 }} />
}

const LensVizPanel: React.FC<Props> = ({ result: { lens_viz, distortion } }) => {
  const maxDisp = Math.max(...lens_viz.displacements, 0.001)
  const avgDisp = lens_viz.displacements.reduce((a, b) => a + b, 0) / lens_viz.displacements.length

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Lens Distortion Grid Overlay
      </Typography>
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 2 }}>
        Green = ideal straight grid · Orange = actual distorted position · Dot color = displacement magnitude
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
        <LensVizCanvas lv={lens_viz} w={480} h={320} />

        <Box sx={{ minWidth: 180 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>Displacement Statistics</Typography>
          {[
            { label: 'Max displacement', value: `${maxDisp.toFixed(2)} px` },
            { label: 'Avg displacement', value: `${avgDisp.toFixed(2)} px` },
            { label: 'Max distortion (px)', value: `${distortion.max_distortion_px.toFixed(2)} px` },
          ].map(s => (
            <Box key={s.label} sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.value}</Typography>
            </Box>
          ))}

          <Box sx={{ mt: 2 }}>
            <Chip
              label={distortion.max_distortion_px < 1 ? 'Minimal distortion' : distortion.max_distortion_px < 5 ? 'Moderate distortion' : 'High distortion'}
              size="small"
              color={distortion.max_distortion_px < 1 ? 'success' : distortion.max_distortion_px < 5 ? 'warning' : 'error'}
              variant="outlined"
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.disabled">
              Grid: {lens_viz.grid_n}×{lens_viz.grid_n} points<br />
              Image: {lens_viz.image_width}×{lens_viz.image_height} px
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Box>
  )
}

export default LensVizPanel
