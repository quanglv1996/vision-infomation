import React, { useRef, useCallback, useState } from 'react'
import {
  Box, Typography, Button, Stack, Chip, Paper, IconButton,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Delete as ClearIcon,
  Image as ImageIcon,
} from '@mui/icons-material'

interface DropAreaProps {
  label: string
  files: File[]
  multiple?: boolean
  required?: boolean
  onFiles: (files: File[]) => void
  onClear: () => void
  isDragging: boolean
  onDragEnter: () => void
  onDragLeave: () => void
}

const DropArea: React.FC<DropAreaProps> = ({
  label, files, multiple, required, onFiles, onClear, isDragging, onDragEnter, onDragLeave,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    onDragLeave()
    const dropped = Array.from(e.dataTransfer.files)
    onFiles(multiple ? dropped : [dropped[0]])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    onFiles(multiple ? selected : [selected[0]])
    e.target.value = ''
  }

  const hasFiles = files.length > 0

  return (
    <Paper
      variant="outlined"
      onDragOver={e => e.preventDefault()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
      sx={{
        p: 2,
        cursor: 'pointer',
        borderColor: isDragging ? '#3B82F6' : hasFiles ? '#10B981' : 'divider',
        bgcolor: isDragging ? 'rgba(59,130,246,0.07)' : hasFiles ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
        transition: 'all 0.15s',
        borderStyle: hasFiles ? 'solid' : 'dashed',
        textAlign: 'center',
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept=".png,.bmp,.jpg,.jpeg,.tif,.tiff"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      {hasFiles ? (
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Stack direction="row" alignItems="center" gap={1}>
            <ImageIcon sx={{ color: '#10B981', fontSize: 20 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#10B981' }}>
                {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {files.length} file{files.length > 1 ? 's' : ''} selected
                {files[0] && ` — ${files[0].name}${files.length > 1 ? ` +${files.length - 1} more` : ''}`}
              </Typography>
            </Box>
          </Stack>
          <IconButton
            size="small"
            onClick={e => { e.stopPropagation(); onClear() }}
            sx={{ color: 'text.secondary' }}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </Stack>
      ) : (
        <Box>
          <UploadIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 0.5 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {label} {required && <Chip label="required" size="small" sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#EF4444', height: 16, fontSize: '0.6rem' }} />}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {multiple ? 'Drag & drop multiple images' : 'Drag & drop or click to select'}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontSize: '0.65rem' }}>
            PNG · BMP · JPEG · TIFF
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

interface UploadZoneProps {
  onAnalyze: (sequence: File[], whiteRef: File | null, darkFrame: File | null) => void
  isLoading: boolean
}

const UploadZone: React.FC<UploadZoneProps> = ({ onAnalyze, isLoading }) => {
  const [sequence, setSequence] = useState<File[]>([])
  const [whiteRef, setWhiteRef] = useState<File | null>(null)
  const [darkFrame, setDarkFrame] = useState<File | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)

  const canAnalyze = sequence.length > 0 && !isLoading

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <DropArea
          label="Image Sequence (10–100 frames)"
          required
          multiple
          files={sequence}
          onFiles={setSequence}
          onClear={() => setSequence([])}
          isDragging={dragging === 'seq'}
          onDragEnter={() => setDragging('seq')}
          onDragLeave={() => setDragging(null)}
        />

        <Stack direction="row" spacing={1.5}>
          <Box sx={{ flex: 1 }}>
            <DropArea
              label="White Reference"
              files={whiteRef ? [whiteRef] : []}
              onFiles={f => setWhiteRef(f[0] ?? null)}
              onClear={() => setWhiteRef(null)}
              isDragging={dragging === 'white'}
              onDragEnter={() => setDragging('white')}
              onDragLeave={() => setDragging(null)}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <DropArea
              label="Dark Frame"
              files={darkFrame ? [darkFrame] : []}
              onFiles={f => setDarkFrame(f[0] ?? null)}
              onClear={() => setDarkFrame(null)}
              isDragging={dragging === 'dark'}
              onDragEnter={() => setDragging('dark')}
              onDragLeave={() => setDragging(null)}
            />
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="flex-end">
          <Button
            variant="contained"
            disabled={!canAnalyze}
            onClick={() => onAnalyze(sequence, whiteRef, darkFrame)}
            sx={{ minWidth: 160 }}
          >
            {isLoading ? 'Analyzing…' : `Analyze  (${sequence.length} frame${sequence.length !== 1 ? 's' : ''})`}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

export default UploadZone
