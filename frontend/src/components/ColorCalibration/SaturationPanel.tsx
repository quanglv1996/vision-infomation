import React, { useRef, useEffect } from 'react'
import { Box, Grid, Stack, Typography } from '@mui/material'
import type { ColorCalibrationResult } from '@/types/colorCalibration'

interface Props { result: ColorCalibrationResult }

const HueWheelCanvas: React.FC<{ hueHist: number[]; size?: number }> = ({ hueHist, size = 220 }) => {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    c.width = size; c.height = size
    const ctx = c.getContext('2d')!
    const cx = size / 2, cy = size / 2, R = size / 2 - 4

    ctx.clearRect(0, 0, size, size)

    // Draw color wheel background
    for (let deg = 0; deg < 360; deg++) {
      const rad0 = (deg - 90) * Math.PI / 180
      const rad1 = (deg - 89) * Math.PI / 180
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, R, rad0, rad1)
      ctx.closePath()
      ctx.fillStyle = `hsl(${deg}, 70%, 50%)`
      ctx.fill()
    }

    // White center
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.45)
    grd.addColorStop(0, 'rgba(15,17,23,1)')
    grd.addColorStop(1, 'rgba(15,17,23,0)')
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.45, 0, Math.PI * 2)
    ctx.fillStyle = grd; ctx.fill()

    // Hue histogram bars (36 bins × 10°)
    const maxH = Math.max(...hueHist, 1)
    hueHist.forEach((v, i) => {
      const angle = (i * 10 - 90) * Math.PI / 180
      const t = v / maxH
      const r0 = R * 0.48
      const r1 = R * (0.48 + 0.45 * t)
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0)
      ctx.lineTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1)
      ctx.strokeStyle = `hsla(${i * 10}, 90%, 65%, 0.9)`
      ctx.lineWidth = 5; ctx.stroke()
    })
  }, [hueHist, size])

  return <canvas ref={ref} style={{ display: 'block', borderRadius: '50%' }} />
}

const SaturationPanel: React.FC<Props> = ({ result: { saturation: sat } }) => {
  const satChartData = sat.saturation_histogram.map((v, i) => ({
    bin: `${Math.round(i * 100 / 32)}%`,
    count: v,
  }))

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Hue, Saturation &amp; Value</Typography>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: 'Mean Hue',        value: `${sat.mean_hue_deg.toFixed(1)}°`, color: `hsl(${sat.mean_hue_deg}, 70%, 60%)` },
          { label: 'Mean Saturation', value: `${sat.mean_saturation_pct.toFixed(1)} %`, color: '#9CA3AF' },
          { label: 'Mean Brightness', value: `${sat.mean_value_pct.toFixed(1)} %`,      color: '#9CA3AF' },
        ].map(m => (
          <Grid item xs={4} key={m.label}>
            <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">{m.label}</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 800, color: m.color }}>{m.value}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>Hue Distribution (color wheel)</Typography>
          <HueWheelCanvas hueHist={sat.hue_histogram} size={220} />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Saturation Histogram (0–100%)
          </Typography>
          <Box sx={{ height: 180 }}>
            {sat.saturation_histogram.map((v, i) => {
              const maxV = Math.max(...sat.saturation_histogram, 1)
              return (
                <Box
                  key={i}
                  component="span"
                  sx={{
                    display: 'inline-block', width: `${100 / 32}%`,
                    height: `${(v / maxV) * 160}px`,
                    bgcolor: `hsl(${i * 3}, 70%, 55%)`,
                    verticalAlign: 'bottom',
                    opacity: 0.8,
                  }}
                />
              )
            })}
          </Box>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" color="text.disabled">0%</Typography>
            <Typography variant="caption" color="text.disabled">50%</Typography>
            <Typography variant="caption" color="text.disabled">100%</Typography>
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

export default SaturationPanel
