import React, { useCallback, useRef, useState } from 'react'
import {
  Box, Button, Chip, IconButton, Paper, Slider, Stack,
  Switch, TextField, Tooltip, Typography,
} from '@mui/material'
import {
  CloudUpload, Delete, ArrowUpward, ArrowDownward,
  Image as ImageIcon, PlayArrow as RunIcon,
} from '@mui/icons-material'
import type { ComparisonWeights, ImageItem } from '@/types/imageComparison'

interface Props {
  onAnalyze: (items: ImageItem[], weights: ComparisonWeights, grayscale: boolean) => void
  isLoading: boolean
}

const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16']

const ComparisonUpload: React.FC<Props> = ({ onAnalyze, isLoading }) => {
  const [items,     setItems]     = useState<ImageItem[]>([])
  const [dragging,  setDragging]  = useState(false)
  const [grayscale, setGrayscale] = useState(false)
  const [weights,   setWeights]   = useState<ComparisonWeights>({
    sharpness: 40, noise: 20, contrast: 20, brightness: 10, entropy: 10,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  let idCounter = useRef(0)

  const addFiles = useCallback((files: File[]) => {
    setItems(prev => {
      const next = [...prev]
      for (const f of files) {
        if (next.length >= 100) break
        idCounter.current++
        next.push({
          id: String(idCounter.current),
          file: f,
          name: f.name.replace(/\.[^.]+$/, ''),
          previewUrl: URL.createObjectURL(f),
        })
      }
      return next
    })
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')))
  }

  const remove = (id: string) =>
    setItems(prev => prev.filter(i => i.id !== id))

  const rename = (id: string, name: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, name } : i))

  const move = (id: string, dir: -1 | 1) =>
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === id)
      if (idx < 0) return prev
      const next = [...prev]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })

  const wTotal = Object.values(weights).reduce((a, b) => a + b, 0)
  const wNorm: ComparisonWeights = {
    sharpness:  weights.sharpness  / wTotal,
    noise:      weights.noise      / wTotal,
    contrast:   weights.contrast   / wTotal,
    brightness: weights.brightness / wTotal,
    entropy:    weights.entropy    / wTotal,
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Drop zone */}
      <Paper
        variant="outlined"
        onDragOver={e => e.preventDefault()}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        sx={{
          p: 3, mb: 2, cursor: 'pointer', textAlign: 'center', borderStyle: 'dashed',
          borderColor: dragging ? '#3B82F6' : items.length > 0 ? '#10B981' : 'divider',
          bgcolor: dragging ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.15s',
        }}
      >
        <input
          ref={inputRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
          onChange={e => { addFiles(Array.from(e.target.files ?? [])); e.target.value = '' }}
        />
        <CloudUpload sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Drop images here or click to browse
        </Typography>
        <Typography variant="caption" color="text.disabled">
          PNG · JPEG · BMP · TIFF — 2 to 100 images
        </Typography>
      </Paper>

      {/* Image list */}
      {items.length > 0 && (
        <Box sx={{ mb: 2, maxHeight: 280, overflowY: 'auto', pr: 0.5 }}>
          {items.map((item, idx) => (
            <Stack
              key={item.id} direction="row" alignItems="center" spacing={1}
              sx={{ mb: 0.5, p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1,
                borderLeft: `3px solid ${COLORS[idx % COLORS.length]}`, bgcolor: 'rgba(255,255,255,0.02)' }}
            >
              {/* Rank badge */}
              <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: COLORS[idx % COLORS.length] + '33',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Typography variant="caption" sx={{ color: COLORS[idx % COLORS.length], fontWeight: 700, fontSize: '0.65rem' }}>
                  {idx + 1}
                </Typography>
              </Box>
              {/* Thumbnail */}
              <Box
                component="img"
                src={item.previewUrl}
                sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 0.5, flexShrink: 0, bgcolor: '#111' }}
              />
              {/* Name input */}
              <TextField
                value={item.name} size="small" variant="standard"
                onChange={e => rename(item.id, e.target.value)}
                sx={{ flex: 1, '& input': { fontSize: '0.8rem' } }}
              />
              {/* Reorder + delete */}
              <Stack direction="row" spacing={0}>
                <IconButton size="small" onClick={() => move(item.id, -1)} disabled={idx === 0}>
                  <ArrowUpward sx={{ fontSize: 14 }} />
                </IconButton>
                <IconButton size="small" onClick={() => move(item.id, 1)} disabled={idx === items.length - 1}>
                  <ArrowDownward sx={{ fontSize: 14 }} />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => remove(item.id)}>
                  <Delete sx={{ fontSize: 14 }} />
                </IconButton>
              </Stack>
            </Stack>
          ))}
        </Box>
      )}

      {/* Settings */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 2 }} alignItems="flex-start">
        {/* Weights */}
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="body2" color="text.secondary">Scoring Weights</Typography>
            <Chip
              label={`Total: ${wTotal}%`}
              size="small"
              color={Math.abs(wTotal - 100) < 1 ? 'success' : 'warning'}
              variant="outlined"
            />
          </Stack>
          {(Object.keys(weights) as (keyof ComparisonWeights)[]).map(k => (
            <Stack key={k} direction="row" alignItems="center" spacing={1} sx={{ mb: 0.3 }}>
              <Typography variant="caption" sx={{ minWidth: 80, color: 'text.secondary', textTransform: 'capitalize' }}>{k}</Typography>
              <Slider
                size="small" min={0} max={100} value={weights[k]}
                onChange={(_, v) => setWeights(prev => ({ ...prev, [k]: v as number }))}
                sx={{ flex: 1 }}
              />
              <Typography variant="caption" sx={{ minWidth: 36, textAlign: 'right', fontFamily: 'monospace' }}>
                {weights[k]}%
              </Typography>
            </Stack>
          ))}
        </Box>

        {/* Options */}
        <Box sx={{ minWidth: 180 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>Options</Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Switch
              size="small" checked={grayscale}
              onChange={e => setGrayscale(e.target.checked)}
            />
            <Typography variant="caption" color="text.secondary">Convert to Grayscale</Typography>
          </Stack>
        </Box>
      </Stack>

      {/* Action */}
      <Stack direction="row" spacing={2} alignItems="center">
        <Button
          variant="contained" size="large" startIcon={<RunIcon />}
          disabled={items.length < 2 || isLoading}
          onClick={() => onAnalyze(items, wNorm, grayscale)}
          sx={{ minWidth: 200 }}
        >
          {isLoading ? 'Analyzing…' : `Compare ${items.length} Images`}
        </Button>
        {items.length < 2 && items.length > 0 && (
          <Typography variant="caption" color="error">Need at least 2 images</Typography>
        )}
        {items.length > 0 && (
          <Button size="small" color="error" variant="outlined" onClick={() => setItems([])}>
            Clear All
          </Button>
        )}
      </Stack>
    </Box>
  )
}

export default ComparisonUpload
