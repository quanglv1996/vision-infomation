import React, { useState } from 'react'
import {
  Box, Button, Chip, FormControl, FormLabel, InputLabel, MenuItem,
  Paper, Select, Stack, TextField, Typography,
} from '@mui/material'
import { CloudUpload as UploadIcon, Delete as ClearIcon, PlayArrow as RunIcon } from '@mui/icons-material'
import type { CalibrationParams } from '@/types/geometricCalibration'

interface Props {
  onCalibrate: (images: File[], params: CalibrationParams) => void
  isLoading: boolean
}

const PATTERNS = [
  { value: 'chessboard',         label: 'Chessboard' },
  { value: 'circles_grid',       label: 'Symmetric Circles Grid' },
  { value: 'asymmetric_circles', label: 'Asymmetric Circles Grid' },
]

const CalibUpload: React.FC<Props> = ({ onCalibrate, isLoading }) => {
  const [files,    setFiles]    = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [pattern,  setPattern]  = useState('chessboard')
  const [cols,     setCols]     = useState(9)
  const [rows,     setRows]     = useState(6)
  const [sqMm,     setSqMm]     = useState(25.0)
  const [sensW,    setSensW]    = useState<string>('')
  const [wd,       setWd]       = useState<string>('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const addFiles = (inc: File[]) =>
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...inc.filter(f => !names.has(f.name))]
    })

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const handleSubmit = () => {
    if (files.length < 3) return
    onCalibrate(files, {
      patternType:      pattern,
      boardCols:        cols,
      boardRows:        rows,
      squareSizeMm:     sqMm,
      sensorWidthMm:    sensW ? parseFloat(sensW) : null,
      workingDistanceMm: wd   ? parseFloat(wd)    : null,
    })
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
          p: 3, cursor: 'pointer', textAlign: 'center',
          borderStyle: 'dashed', mb: 2,
          borderColor: dragging ? '#3B82F6' : files.length >= 3 ? '#10B981' : 'divider',
          bgcolor:     dragging ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)',
          transition:  'all 0.15s',
        }}
      >
        <input
          ref={inputRef} type="file" multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { addFiles(Array.from(e.target.files ?? [])); e.target.value = '' }}
        />
        <UploadIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Drop calibration images here or click to browse
        </Typography>
        <Typography variant="caption" color="text.disabled">
          PNG / JPEG / BMP / TIFF — minimum 3 images, recommended 20–30
        </Typography>
      </Paper>

      {/* File chips */}
      {files.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 2 }}>
          {files.map((f, i) => (
            <Chip
              key={i} label={f.name} size="small" variant="outlined"
              onDelete={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
            />
          ))}
          <Chip
            label="Clear all" size="small" color="error" variant="outlined"
            icon={<ClearIcon />} onClick={() => setFiles([])}
          />
        </Stack>
      )}

      {/* Settings grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' },
          gap: 2, mb: 2,
        }}
      >
        <FormControl size="small">
          <InputLabel>Pattern Type</InputLabel>
          <Select value={pattern} label="Pattern Type" onChange={e => setPattern(e.target.value)}>
            {PATTERNS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
          </Select>
        </FormControl>

        <TextField
          label="Board Cols" type="number" size="small" value={cols}
          inputProps={{ min: 3, max: 30, step: 1 }}
          onChange={e => setCols(parseInt(e.target.value) || 9)}
          helperText="Inner corners"
        />
        <TextField
          label="Board Rows" type="number" size="small" value={rows}
          inputProps={{ min: 3, max: 30, step: 1 }}
          onChange={e => setRows(parseInt(e.target.value) || 6)}
          helperText="Inner corners"
        />
        <TextField
          label="Square Size (mm)" type="number" size="small" value={sqMm}
          inputProps={{ min: 0.1, step: 'any' }}
          onChange={e => setSqMm(parseFloat(e.target.value) || 25)}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <TextField
          label="Sensor Width (mm) — optional" type="number" size="small" value={sensW}
          inputProps={{ step: 'any' }}
          onChange={e => setSensW(e.target.value)}
          helperText="e.g. 6.4 for 1/2.5″ sensor"
        />
        <TextField
          label="Working Distance (mm) — optional" type="number" size="small" value={wd}
          inputProps={{ step: 'any' }}
          onChange={e => setWd(e.target.value)}
          helperText="Nominal camera-to-object distance"
        />
      </Box>

      <Button
        variant="contained" size="large" startIcon={<RunIcon />}
        disabled={files.length < 3 || isLoading}
        onClick={handleSubmit}
        sx={{ minWidth: 200 }}
      >
        {isLoading ? 'Calibrating…' : `Calibrate (${files.length} images)`}
      </Button>

      {files.length > 0 && files.length < 3 && (
        <Typography variant="caption" color="error" sx={{ ml: 2 }}>
          Need at least 3 images
        </Typography>
      )}
    </Box>
  )
}

export default CalibUpload
