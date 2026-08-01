import React, { useRef, useEffect } from 'react'
import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'
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

const DiffHeatmapCanvas: React.FC<{ data: number[][], rows: number, cols: number }> = ({ data, rows, cols }) => {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas || !data.length) return
    const ctx = canvas.getContext('2d')!
    let mn = 0, mx = -Infinity
    for (const row of data) for (const v of row) if (v > mx) mx = v
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
    canvas.width = 320; canvas.height = 220
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(tmp, 0, 0, 320, 220)
  }, [data, rows, cols])
  return <canvas ref={ref} style={{ display: 'block', borderRadius: 4 }} />
}

const DiffPanel: React.FC<Props> = ({ result, colors }) => {
  const diff = result.diff_result
  if (!diff) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">
          Image difference is only computed for exactly 2 images.
          Upload exactly 2 images to see PSNR, SSIM, and the difference heatmap.
        </Typography>
      </Box>
    )
  }

  const m0 = result.metrics[diff.img1_idx]
  const m1 = result.metrics[diff.img2_idx]
  const psnrColor = diff.psnr >= 40 ? '#10B981' : diff.psnr >= 30 ? '#F59E0B' : '#EF4444'
  const ssimColor = diff.ssim == null ? '#9CA3AF' : diff.ssim >= 0.95 ? '#10B981' : diff.ssim >= 0.80 ? '#F59E0B' : '#EF4444'

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Image Difference — {m0.name} vs {m1.name}
      </Typography>

      {/* Metrics */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: 'PSNR',  value: `${diff.psnr.toFixed(2)} dB`, color: psnrColor,
            sub: diff.psnr >= 40 ? 'Excellent' : diff.psnr >= 30 ? 'Good' : 'Low' },
          { label: 'SSIM',  value: diff.ssim != null ? diff.ssim.toFixed(4) : 'N/A', color: ssimColor,
            sub: diff.ssim != null ? (diff.ssim >= 0.95 ? 'High similarity' : 'Low similarity') : '' },
          { label: 'MSE',   value: diff.mse.toFixed(4), color: '#9CA3AF', sub: 'lower = more similar' },
          { label: 'RMSE',  value: Math.sqrt(diff.mse).toFixed(4), color: '#9CA3AF', sub: '' },
        ].map(item => (
          <Grid item xs={6} sm={3} key={item.label}>
            <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
              <CardContent sx={{ p: '12px !important' }}>
                <Typography variant="caption" color="text.secondary" display="block">{item.label}</Typography>
                <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 800, color: item.color }}>{item.value}</Typography>
                <Typography variant="caption" color="text.disabled">{item.sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Diff heatmap */}
      <Typography variant="body2" color="text.secondary" gutterBottom>Difference Heatmap</Typography>
      <Stack direction="row" spacing={3} alignItems="flex-start">
        <DiffHeatmapCanvas data={diff.diff_map} rows={diff.diff_map_rows} cols={diff.diff_map_cols} />
        <Box>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1 }}>
            Blue = identical regions<br />
            Red = large differences<br />
          </Typography>
          <Stack spacing={0.5}>
            {[m0, m1].map((img, i) => (
              <Box key={i} sx={{ px: 1.5, py: 0.5, border: '1px solid', borderColor: colors[diff[`img${i+1}_idx` as 'img1_idx']] ?? colors[i], borderRadius: 0.5, bgcolor: (colors[diff[`img${i+1}_idx` as 'img1_idx']] ?? colors[i]) + '11' }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: colors[i] }}>
                  [{i+1}] {img.name} — {img.width}×{img.height}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

export default DiffPanel
