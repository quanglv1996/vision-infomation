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
  const clamp = (v: number) => Math.max(0, Math.min(1, v))
  const r = clamp(1.5 - Math.abs(4 * t - 3))
  const g = clamp(1.5 - Math.abs(4 * t - 2))
  const b = clamp(1.5 - Math.abs(4 * t - 1))
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

const HeatmapCanvas: React.FC<Props> = ({ data, rows, cols, width = 320, height = 200 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data.length) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Find min/max across all data
    let mn = Infinity, mx = -Infinity
    for (const row of data)
      for (const v of row) { if (v < mn) mn = v; if (v > mx) mx = v }
    const range = mx - mn || 1

    const imgData = ctx.createImageData(cols, rows)
    let idx = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const t = (data[r]?.[c] ?? 0 - mn) / range
        const [red, green, blue] = jetColor(Math.max(0, Math.min(1, t)))
        imgData.data[idx++] = red
        imgData.data[idx++] = green
        imgData.data[idx++] = blue
        imgData.data[idx++] = 255
      }
    }

    const tmp = document.createElement('canvas')
    tmp.width = cols; tmp.height = rows
    tmp.getContext('2d')!.putImageData(imgData, 0, 0)

    canvas.width = width; canvas.height = height
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(tmp, 0, 0, width, height)
  }, [data, rows, cols, width, height])

  return (
    <Box sx={{ borderRadius: 1, overflow: 'hidden', display: 'inline-block' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
    </Box>
  )
}

export default HeatmapCanvas
