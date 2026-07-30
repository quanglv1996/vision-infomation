import React, { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { fetchRecommendations } from '@/services/api'
import type { RecommendRequest, SystemRecommendation } from '@/types'

const RecommendationPanel: React.FC = () => {
  const [req, setReq] = useState<RecommendRequest>({
    required_fov_x: undefined,
    required_accuracy: undefined,
    working_distance: undefined,
    smallest_feature: undefined,
  })

  const { mutate, data, isPending } = useMutation({
    mutationFn: (r: RecommendRequest) => fetchRecommendations(r),
  })

  const set = (key: keyof RecommendRequest, val: string) => {
    const num = parseFloat(val)
    setReq(prev => ({ ...prev, [key]: isNaN(num) ? undefined : num }))
  }

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
        Camera + Lens Recommendation
      </Typography>

      {/* Requirement inputs */}
      <Stack direction="row" flexWrap="wrap" gap={1.5} mb={2}>
        {([
          ['required_fov_x', 'Required FOV X', 'mm'],
          ['required_accuracy', 'Required Accuracy', 'mm'],
          ['working_distance', 'Working Distance', 'mm'],
          ['smallest_feature', 'Smallest Feature', 'mm'],
          ['speed', 'Object Speed', 'mm/s'],
        ] as const).map(([key, label, unit]) => (
          <TextField
            key={key}
            label={`${label} [${unit}]`}
            size="small"
            sx={{ width: 180 }}
            onChange={e => set(key, e.target.value)}
          />
        ))}
        <Button
          variant="contained"
          onClick={() => mutate(req)}
          disabled={isPending}
          startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{ alignSelf: 'flex-end' }}
        >
          Find Systems
        </Button>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Results */}
      {data && data.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No matching camera + lens combinations found. Try relaxing the constraints.
        </Typography>
      )}

      {data && data.map((rec, i) => (
        <RecommendationCard key={i} rec={rec} rank={i + 1} />
      ))}
    </Box>
  )
}

const RecommendationCard: React.FC<{ rec: SystemRecommendation; rank: number }> = ({ rec, rank }) => {
  const [expanded, setExpanded] = useState(rank <= 2)

  return (
    <Paper
      variant="outlined"
      sx={{ mb: 1.5, overflow: 'hidden', cursor: 'pointer' }}
      onClick={() => setExpanded(e => !e)}
    >
      <Stack direction="row" alignItems="center" p={1.5} gap={1.5}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: rank === 1 ? '#F59E0B' : rank === 2 ? '#94A3B8' : 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.75rem',
            flexShrink: 0,
          }}
        >
          {rank}
        </Box>
        <Box flex={1}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {rec.camera.brand} {rec.camera.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            + {rec.lens.brand} {rec.lens.name} ({rec.lens.focal_length}mm f/{rec.lens.min_f_number})
          </Typography>
        </Box>
        <Chip label={`Score: ${rec.score.toFixed(0)}`} size="small" sx={{ bgcolor: 'rgba(59,130,246,0.15)', color: '#3B82F6' }} />
      </Stack>

      {expanded && (
        <Box px={2} pb={2} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          {/* Key specs */}
          <Stack direction="row" flexWrap="wrap" gap={1} mt={1.5} mb={1}>
            {[
              ['Resolution', `${rec.camera.resolution_x}×${rec.camera.resolution_y} px`],
              ['Pixel Size', `${rec.camera.pixel_size} μm`],
              ['Sensor', rec.camera.sensor_format],
              ['FPS', `${rec.camera.fps}`],
              ['Interface', rec.camera.interface],
            ].map(([k, v]) => (
              <Paper key={k} variant="outlined" sx={{ px: 1, py: 0.5 }}>
                <Typography variant="caption" color="text.secondary">{k}: </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{v}</Typography>
              </Paper>
            ))}
          </Stack>

          {/* Computed values */}
          {Object.keys(rec.computed).length > 0 && (
            <Box mb={1}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Computed Parameters
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {(['mm_per_pixel', 'fov_x', 'dof', 'pixels_per_feature', 'blur_pixels'] as const).map(key => {
                  const val = rec.computed[key]
                  if (val === undefined) return null
                  return (
                    <Chip
                      key={key}
                      label={`${key.replace(/_/g, ' ')}: ${parseFloat(val.toPrecision(4))}`}
                      size="small"
                      sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: '0.68rem' }}
                    />
                  )
                })}
              </Stack>
            </Box>
          )}

          {/* Reasons */}
          {rec.reasons.map(r => (
            <Typography key={r} variant="caption" sx={{ display: 'block', color: '#10B981', pl: 1, '&:before': { content: '"✓ "' } }}>
              {r}
            </Typography>
          ))}
          {rec.warnings.map(w => (
            <Typography key={w} variant="caption" sx={{ display: 'block', color: '#F59E0B', pl: 1, '&:before': { content: '"⚠ "' } }}>
              {w}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  )
}

export default RecommendationPanel
