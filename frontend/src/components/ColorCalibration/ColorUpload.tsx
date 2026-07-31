import React, { useRef, useState } from 'react'
import {
  Box, Button, Chip, FormControl, InputLabel,
  MenuItem, Paper, Select, Stack, Typography,
} from '@mui/material'
import { CloudUpload as UploadIcon, PlayArrow as RunIcon } from '@mui/icons-material'

interface Props {
  onAnalyze: (image: File, imageType: string) => void
  isLoading: boolean
}

const IMAGE_TYPES = [
  { value: 'reference',    label: 'General Reference Image' },
  { value: 'white_card',   label: 'White Card / White Reference' },
  { value: 'gray_card',    label: 'Gray Card (18% gray)' },
  { value: 'colorchecker', label: 'Macbeth ColorChecker (24 patches)' },
]

const ColorUpload: React.FC<Props> = ({ onAnalyze, isLoading }) => {
  const [file,      setFile]      = useState<File | null>(null)
  const [dragging,  setDragging]  = useState(false)
  const [imageType, setImageType] = useState('reference')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  return (
    <Box sx={{ p: 2 }}>
      <Paper
        variant="outlined"
        onDragOver={e => e.preventDefault()}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        sx={{
          p: 3, cursor: 'pointer', textAlign: 'center', mb: 2,
          borderStyle: 'dashed',
          borderColor: dragging ? '#3B82F6' : file ? '#10B981' : 'divider',
          bgcolor: dragging ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.15s',
        }}
      >
        <input
          ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); e.target.value = '' }}
        />
        <UploadIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {file ? file.name : 'Drop calibration image here or click to browse'}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          PNG / JPEG / BMP / TIFF — white card, gray card, or ColorChecker
        </Typography>
      </Paper>

      {file && (
        <Chip
          label={file.name} size="small" variant="outlined"
          onDelete={() => setFile(null)} sx={{ mb: 2 }}
        />
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel>Image Type</InputLabel>
          <Select value={imageType} label="Image Type" onChange={e => setImageType(e.target.value)}>
            {IMAGE_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </Select>
        </FormControl>

        <Button
          variant="contained" size="large" startIcon={<RunIcon />}
          disabled={!file || isLoading}
          onClick={() => file && onAnalyze(file, imageType)}
          sx={{ minWidth: 180 }}
        >
          {isLoading ? 'Analyzing…' : 'Analyze Color'}
        </Button>
      </Stack>
    </Box>
  )
}

export default ColorUpload
