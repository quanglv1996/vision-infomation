import React, { useMemo, useState } from 'react'
import { Alert, Box, Button, Chip, CircularProgress, Collapse, Stack, Typography } from '@mui/material'
import {
  CameraAlt as CameraIcon,
  ExpandLess as LessIcon,
  ExpandMore as MoreIcon,
  Inventory2 as CatalogIcon,
} from '@mui/icons-material'
import { useMutation } from '@tanstack/react-query'
import { fetchRecommendations } from '@/services/api'
import { errorMessage } from '@/services/http'
import { TONE } from '@/theme/status'
import { MONO_FONT, tint } from '@/theme/theme'
import type { RecommendRequest, SystemRecommendation } from '@/types'
import { formatNumber } from '@/utils/format'

/** Catalog search request from the calculator's current values. */
export function recommendRequest(v: Record<string, number>): RecommendRequest | null {
  const req: RecommendRequest = {
    required_fov_x: v.fov_x,
    required_fov_y: v.fov_y,
    required_accuracy: v.required_accuracy,
    working_distance: v.working_distance,
    smallest_feature: v.smallest_feature,
    speed: v.speed,
    max_blur_pixels: v.max_blur_allowed,
  }
  for (const k of Object.keys(req) as (keyof RecommendRequest)[]) if (req[k] === undefined) delete req[k]
  return req.required_fov_x ? req : null
}

const COMPUTED: [string, string, string][] = [
  ['mm_per_pixel', 'mm/px', ''],
  ['fov_x', 'FOV', 'mm'],
  ['working_distance', 'WD', 'mm'],
  ['dof', 'DOF', 'mm'],
  ['pixels_per_feature', 'px/chi tiết', ''],
  ['blur_pixels', 'Nhòe', 'px'],
]

const Card: React.FC<{ rec: SystemRecommendation; rank: number; accent: string }> = ({ rec, rank, accent }) => {
  const [open, setOpen] = useState(rank === 1)
  const medal = rank === 1 ? '#F59E0B' : rank === 2 ? '#94A3B8' : rank === 3 ? '#B45309' : 'rgba(148,163,184,0.25)'
  return (
    <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: rank === 1 ? tint(accent, 0.5) : 'divider', overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" gap={1.25} sx={{ p: 1.25, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: medal, color: '#0B0E14', fontWeight: 800, fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {rank}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography noWrap sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{rec.camera.brand} {rec.camera.name}</Typography>
          <Typography noWrap sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
            + {rec.lens.brand} {rec.lens.name} · f {rec.lens.focal_length} mm
          </Typography>
        </Box>
        <Chip size="small" label={rec.score.toFixed(0)} sx={{ fontFamily: MONO_FONT, bgcolor: tint(accent, 0.15), color: accent }} />
        {open ? <LessIcon sx={{ fontSize: 18 }} /> : <MoreIcon sx={{ fontSize: 18 }} />}
      </Stack>
      <Collapse in={open}>
        <Box sx={{ px: 1.5, pb: 1.5 }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 0.75 }}>
            {rec.camera.resolution_x}×{rec.camera.resolution_y} px · {rec.camera.pixel_size} µm · {rec.camera.sensor_format} · {rec.camera.fps} fps · {rec.camera.interface}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
            {COMPUTED.filter(([k]) => rec.computed[k] !== undefined).map(([k, label, unit]) => (
              <Chip key={k} size="small" label={`${label} ${formatNumber(rec.computed[k])}${unit ? ` ${unit}` : ''}`}
                sx={{ fontFamily: MONO_FONT, fontSize: '0.66rem', bgcolor: 'rgba(148,163,184,0.08)' }} />
            ))}
          </Stack>
          {rec.reasons.map(r => <Typography key={r} sx={{ fontSize: '0.72rem', color: TONE.success }}>✓ {r}</Typography>)}
          {rec.warnings.map(w => <Typography key={w} sx={{ fontSize: '0.72rem', color: TONE.warning }}>⚠ {w}</Typography>)}
        </Box>
      </Collapse>
    </Box>
  )
}

/** "Gợi ý camera + lens": ranks catalog combinations against the current FOV / accuracy / WD. */
const Recommendations: React.FC<{ values: Record<string, number>; accent: string }> = ({ values, accent }) => {
  const req = useMemo(() => recommendRequest(values), [values])
  const reqKey = JSON.stringify(req)
  const [searchedKey, setSearchedKey] = useState<string | null>(null)
  const { mutate, data, isPending, error, reset } = useMutation({ mutationFn: fetchRecommendations })

  const search = () => { if (req) { setSearchedKey(reqKey); mutate(req) } }
  const stale = data && searchedKey !== reqKey

  return (
    <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(148,163,184,0.03)' }}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
        <CatalogIcon sx={{ fontSize: 18, color: accent }} />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, flex: 1 }}>Gợi ý camera + lens từ catalog</Typography>
        {data && <Button size="small" onClick={() => { reset(); setSearchedKey(null) }} sx={{ fontSize: '0.7rem' }}>Ẩn</Button>}
      </Stack>
      {!req ? (
        <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary' }}>Cần có FOV ngang (nhập vật hoặc FOV) để tìm cấu hình phù hợp.</Typography>
      ) : (
        <>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 1 }}>
            Theo FOV {formatNumber(req.required_fov_x)} mm
            {req.working_distance ? ` · WD ${formatNumber(req.working_distance)} mm` : ''}
            {req.required_accuracy ? ` · độ chính xác ${formatNumber(req.required_accuracy)} mm` : ''}
            {req.smallest_feature ? ` · chi tiết ${formatNumber(req.smallest_feature)} mm` : ''}
          </Typography>
          {(!data || stale) && (
            <Button
              size="small" variant="outlined" fullWidth onClick={search} disabled={isPending}
              startIcon={isPending ? <CircularProgress size={14} /> : <CameraIcon />}
            >
              {stale ? 'Thông số đã đổi — tìm lại' : 'Tìm camera + lens phù hợp'}
            </Button>
          )}
        </>
      )}
      {error && <Alert severity="error" sx={{ mt: 1 }}>{errorMessage(error, 'Không tìm được gợi ý.')}</Alert>}
      {data && data.length === 0 && (
        <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', mt: 1 }}>Không có tổ hợp nào trong catalog đáp ứng — nới lỏng yêu cầu.</Typography>
      )}
      {data && data.length > 0 && (
        <Stack gap={1} sx={{ mt: 1, opacity: stale ? 0.55 : 1 }}>
          {data.slice(0, 5).map((rec, i) => <Card key={`${rec.camera.id}-${rec.lens.id}`} rec={rec} rank={i + 1} accent={accent} />)}
        </Stack>
      )}
    </Box>
  )
}

export default Recommendations
