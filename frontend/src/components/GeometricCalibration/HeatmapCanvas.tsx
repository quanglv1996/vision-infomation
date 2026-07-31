import React, { useRef, useEffect } from 'react'
import { Box } from '@mui/material'

interface Props {
  data: number[][]
  rows: number
  cols: number
  width?: number
  height?: number
}

function jetColor(t: number): [number, number, number] {
  const c = (v: number) => Math.max(0, Math.min(1, v))
  return [
    Math.round(c(1.5 - Math.abs(4 * t - 3)) * 255),
    Math.round(c(1.5 - Math.abs(4 * t - 2)) * 255),
    Math.round(c(1.5 - Math.abs(4 * t - 1)) * 255),
  ]
}

const HeatmapCanvas: React.FC<Props> = ({ data, rows, cols, width = 300, height = 200 }) => {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !data.length) return
    const ctx = canvas.getContext('2d')!
    let mn = Infinity, mx = -Infinity
    for (const row of data) for (const v of row) { if (v < mn) mn = v; if (v > mx) mx = v }
    const range = mx - mn || 1
    const img = ctx.createImageData(cols, rows)
    let i = 0
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const [R, G, B] = jetColor(((data[r]?.[c] ?? 0) - mn) / range)
        img.data[i++] = R; img.data[i++] = G; img.data[i++] = B; img.data[i++] = 255
      }
    const tmp = document.createElement('canvas')
    tmp.width = cols; tmp.height = rows
    tmp.getContext('2d')!.putImageData(img, 0, 0)
    canvas.width = width; canvas.height = height
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(tmp, 0, 0, width, height)
  }, [data, rows, cols, width, height])

  return (
    <Box sx={{ borderRadius: 1, overflow: 'hidden', display: 'inline-block' }}>
      <canvas ref={ref} style={{ display: 'block' }} />
    </Box>
  )
}

export default HeatmapCanvas
