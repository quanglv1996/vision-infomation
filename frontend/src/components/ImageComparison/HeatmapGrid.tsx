import React, { useRef, useEffect, useState } from 'react'
import { Box, Stack, Tab, Tabs, Typography } from '@mui/material'
import type { ComparisonResult } from '@/types/imageComparison'

interface Props { result: ComparisonResult; colors: string[] }

function jetColor(t: number): [number, number, number] {
  const c = (v: number) => Math.max(0, Math.min(1, v))
  return [
    Math.round(c(1.5 - Math.abs(4*t - 3)) * 255),
    Math.round(c(1.5 - Math.abs(4*t - 2)) * 255),
    Math.round(c(1.5 - Math.abs(4*t - 1)) * 255),
  ]
}

const MapCanvas: React.FC<{
  data: number[][]
  rows: number; cols: number
  title: string; color: string
  w?: number; h?: number
}> = ({ data, rows, cols, title, color, w = 140, h = 100 }) => {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current; if (!canvas || !data.length) return
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

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ border: `2px solid ${color}44`, borderRadius: 1, overflow: 'hidden', display: 'inline-block', mb: 0.3 }}>
        <canvas ref={ref} style={{ display: 'block' }} />
      </Box>
      <Typography variant="caption" sx={{ color, display: 'block', fontSize: '0.65rem',
        maxWidth: w, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title}
      </Typography>
    </Box>
  )
}

const HeatmapGrid: React.FC<Props> = ({ result, colors }) => {
  const [mapType, setMapType] = useState<'focus' | 'noise'>('focus')
  const m = result.metrics

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">
          {mapType === 'focus' ? 'Focus Maps (Laplacian per block)' : 'Noise Maps (MAD residual per block)'}
        </Typography>
        <Tabs value={mapType} onChange={(_, v) => setMapType(v)}
          sx={{ minHeight: 28, '& .MuiTab-root': { minHeight: 28, fontSize: '0.72rem', py: 0.3 } }}>
          <Tab value="focus" label="Focus Map" />
          <Tab value="noise" label="Noise Map" />
        </Tabs>
      </Stack>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {m.map((img, i) => (
          mapType === 'focus' ? (
            <MapCanvas
              key={img.index}
              data={img.focus_map} rows={img.focus_map_rows} cols={img.focus_map_cols}
              title={`${img.name} · Lap=${img.laplacian_variance.toFixed(0)}`}
              color={colors[i % colors.length]}
              w={160} h={110}
            />
          ) : (
            <MapCanvas
              key={img.index}
              data={img.noise_map} rows={img.noise_map_rows} cols={img.noise_map_cols}
              title={`${img.name} · σ=${img.noise_std.toFixed(4)}%`}
              color={colors[i % colors.length]}
              w={160} h={110}
            />
          )
        ))}
      </Box>

      <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
        {mapType === 'focus'
          ? 'Blue = blurry regions · Red = sharp regions. Ideal: uniformly red/warm throughout.'
          : 'Blue = clean regions · Red = noisy regions. Ideal: uniformly blue/cool throughout.'}
      </Typography>
    </Box>
  )
}

export default HeatmapGrid
