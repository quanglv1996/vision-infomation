import React, { useRef, useState } from 'react'
import { Box, Button, Chip, IconButton, Paper, Stack, Typography } from '@mui/material'
import { CloudUpload as UploadIcon, Delete as ClearIcon, Image as ImageIcon } from '@mui/icons-material'

interface Props {
  onAnalyze: (images: File[]) => void
  isLoading: boolean
}

const ImageQualityUpload: React.FC<Props> = ({ onAnalyze, isLoading }) => {
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (incoming: File[]) => setFiles(prev => {
    const names = new Set(prev.map(f => f.name))
    return [...prev, ...incoming.filter(f => !names.has(f.name))]
  })

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []))
    e.target.value = ''
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
          p: 3,
          cursor: 'pointer',
          textAlign: 'center',
          borderStyle: 'dashed',
          borderColor: dragging ? '#3B82F6' : files.length > 0 ? '#10B981' : 'divider',
          bgcolor: dragging ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.15s',
          mb: 2,
        }}
      >
        <input ref={inputRef} type="file" multiple accept=".png,.bmp,.jpg,.jpeg,.tif,.tiff"
          style={{ display: 'none' }} onChange={handleChange} />
        <UploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Drop images here or click to select
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          PNG · BMP · JPEG · TIFF — Single image or sequence for temporal noise
        </Typography>
        {files.length > 0 && (
          <Chip label={`${files.length} file${files.length > 1 ? 's' : ''} selected`} size="small"
            sx={{ mt: 1, bgcolor: 'rgba(16,185,129,0.15)', color: '#10B981' }} />
        )}
      </Paper>

      {/* File list */}
      {files.length > 0 && (
        <Stack gap={0.5} mb={2} sx={{ maxHeight: 120, overflowY: 'auto' }}>
          {files.slice(0, 8).map((f, i) => (
            <Stack key={i} direction="row" alignItems="center" gap={1}
              sx={{ px: 1.5, py: 0.5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1 }}>
              <ImageIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                {(f.size / 1024).toFixed(0)} KB
              </Typography>
            </Stack>
          ))}
          {files.length > 8 && (
            <Typography variant="caption" sx={{ color: 'text.secondary', px: 1.5 }}>
              +{files.length - 8} more files…
            </Typography>
          )}
        </Stack>
      )}

      <Stack direction="row" justifyContent="flex-end" gap={1}>
        {files.length > 0 && (
          <Button size="small" startIcon={<ClearIcon />} onClick={() => setFiles([])}>
            Clear
          </Button>
        )}
        <Button
          variant="contained"
          disabled={files.length === 0 || isLoading}
          onClick={() => onAnalyze(files)}
          sx={{ minWidth: 140 }}
        >
          {isLoading ? 'Analyzing…' : `Analyze  (${files.length} image${files.length !== 1 ? 's' : ''})`}
        </Button>
      </Stack>
    </Box>
  )
}

export default ImageQualityUpload
