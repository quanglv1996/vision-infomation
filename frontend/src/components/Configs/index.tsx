import React, { useMemo, useRef, useState } from 'react'
import {
  Alert, Box, Button, ButtonBase, Chip, CircularProgress, Dialog, DialogActions, DialogContent, IconButton,
  InputAdornment, ListItemIcon, Menu, MenuItem, Select, Stack, TextField, Tooltip, Typography,
} from '@mui/material'
import {
  Add as AddIcon,
  Bookmarks as ConfigsIcon,
  ContentCopy as DuplicateIcon,
  DeleteOutline as DeleteIcon,
  DriveFileRenameOutline as RenameIcon,
  FileDownloadOutlined as ExportIcon,
  FileUploadOutlined as ImportIcon,
  Lock as LockIcon,
  MoreVert as MoreIcon,
  OpenInNew as OpenIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import ModuleHeader from '@/components/common/ModuleHeader'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { TEXT_INPUT_SX } from '@/components/Auth/AuthDialog'
import { PARAM_LABELS_VI } from '@/components/Scenarios/paramLabels'
import { SCENARIOS } from '@/components/Scenarios/scenarios'
import { useParameters } from '@/hooks/useParameters'
import { createConfig, deleteConfig, duplicateConfig, fetchConfigs, updateConfig } from '@/services/configApi'
import { errorMessage } from '@/services/http'
import { useAuthStore } from '@/stores/authStore'
import { FREE_KEY, useConfigStore } from '@/stores/configStore'
import { useNavStore } from '@/stores/navStore'
import { ACCENT, MONO_FONT, tint } from '@/theme/theme'
import type { Parameter } from '@/types'
import type { ConfigInput, SavedConfig } from '@/types/config'
import { foldText, formatDateTime, formatNumber, formatRelative } from '@/utils/format'
import ConfigFormDialog from './ConfigFormDialog'
import { configMeta, FREE_TITLE, keyResults } from './configMeta'

const ACCENT_CONFIGS = ACCENT.emerald

type Sort = 'updated' | 'created' | 'name'

const labelOf = (id: string, paramById: Record<string, Parameter>) => PARAM_LABELS_VI[id] ?? paramById[id]?.name ?? id

const ValueLine: React.FC<{ id: string; value: number; paramById: Record<string, Parameter>; color?: string }> = ({ id, value, paramById, color }) => (
  <Stack direction="row" justifyContent="space-between" gap={1} sx={{ py: 0.4, borderBottom: '1px dashed rgba(148,163,184,0.12)' }}>
    <Typography sx={{ fontSize: '0.78rem', color: '#CBD5E1' }}>{labelOf(id, paramById)}</Typography>
    <Typography sx={{ fontSize: '0.78rem', fontFamily: MONO_FONT, color: color ?? '#E2E8F0', whiteSpace: 'nowrap' }}>
      {formatNumber(value, 5)} <Box component="span" sx={{ color: 'text.secondary' }}>{paramById[id]?.unit}</Box>
    </Typography>
  </Stack>
)

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  cfg: SavedConfig
  paramById: Record<string, Parameter>
  active: boolean
  onOpen: () => void
  onDetails: () => void
  onRename: () => void
  onDuplicate: () => void
  onExport: () => void
  onDelete: () => void
}

const ConfigCard: React.FC<CardProps> = ({ cfg, paramById, active, onOpen, onDetails, onRename, onDuplicate, onExport, onDelete }) => {
  const meta = configMeta(cfg)
  const [menu, setMenu] = useState<HTMLElement | null>(null)
  const results = keyResults(cfg)
  const act = (fn: () => void) => () => { setMenu(null); fn() }

  return (
    <Box
      sx={{
        position: 'relative', borderRadius: 2.5, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        border: '1px solid', borderColor: active ? tint(meta.accent, 0.6) : 'divider',
        background: `linear-gradient(160deg, ${tint(meta.accent, 0.09)} 0%, rgba(20,24,34,0.9) 45%)`,
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        '&:hover': { borderColor: tint(meta.accent, 0.55), transform: 'translateY(-2px)', boxShadow: `0 10px 28px ${tint(meta.accent, 0.15)}` },
      }}
    >
      <Box sx={{ height: 3, bgcolor: meta.accent }} />
      <ButtonBase onClick={onDetails} sx={{ display: 'block', textAlign: 'left', p: 2, pb: 1.25, flex: 1 }}>
        <Stack direction="row" gap={1.25} alignItems="flex-start">
          <Box sx={{ width: 38, height: 38, flexShrink: 0, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: tint(meta.accent, 0.18), color: meta.accent }}>
            <meta.Icon sx={{ fontSize: 21 }} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1, pr: 3 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.3, wordBreak: 'break-word' }}>{cfg.name}</Typography>
            <Typography noWrap sx={{ fontSize: '0.72rem', color: meta.accent, fontWeight: 600 }}>
              {meta.title}{meta.modeLabel && <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}> · {meta.modeLabel}</Box>}
            </Typography>
          </Box>
        </Stack>

        <Typography
          sx={{
            mt: 1.25, fontSize: '0.78rem', lineHeight: 1.5, color: cfg.description ? '#CBD5E1' : 'text.secondary',
            fontStyle: cfg.description ? 'normal' : 'italic',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.3rem',
          }}
        >
          {cfg.description || 'Không có mô tả'}
        </Typography>

        {results.length > 0 && (
          <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
            {results.map(id => (
              <Box key={id} sx={{ px: 1, py: 0.75, borderRadius: 1.25, bgcolor: 'rgba(148,163,184,0.06)' }}>
                <Typography noWrap sx={{ fontSize: '0.64rem', color: 'text.secondary' }}>{labelOf(id, paramById)}</Typography>
                <Typography noWrap sx={{ fontFamily: MONO_FONT, fontSize: '0.84rem', fontWeight: 700 }}>
                  {formatNumber(cfg.results[id])}
                  <Box component="span" sx={{ fontSize: '0.64rem', color: 'text.secondary', fontWeight: 500, ml: 0.5 }}>{paramById[id]?.unit}</Box>
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </ButtonBase>

      <IconButton size="small" onClick={e => setMenu(e.currentTarget)} sx={{ position: 'absolute', top: 12, right: 8 }} aria-label="Thao tác">
        <MoreIcon fontSize="small" />
      </IconButton>

      <Stack direction="row" alignItems="center" gap={1} sx={{ px: 2, py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
        <Tooltip title={`Cập nhật ${formatDateTime(cfg.updated_at)}`}>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
            {Object.keys(cfg.values).length} thông số · {formatRelative(cfg.updated_at)}
          </Typography>
        </Tooltip>
        {active && <Chip size="small" label="Đang mở" sx={{ height: 18, fontSize: '0.62rem', bgcolor: tint(meta.accent, 0.18), color: meta.accent }} />}
        <Box sx={{ flex: 1 }} />
        <Button size="small" variant="outlined" startIcon={<OpenIcon sx={{ fontSize: '15px !important' }} />} onClick={onOpen}
          sx={{ borderColor: tint(meta.accent, 0.5), color: meta.accent, '&:hover': { borderColor: meta.accent, bgcolor: tint(meta.accent, 0.08) } }}>
          Mở
        </Button>
      </Stack>

      <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem onClick={act(onOpen)}><ListItemIcon><OpenIcon fontSize="small" /></ListItemIcon>Mở để thử nghiệm / sửa</MenuItem>
        <MenuItem onClick={act(onRename)}><ListItemIcon><RenameIcon fontSize="small" /></ListItemIcon>Đổi tên & mô tả</MenuItem>
        <MenuItem onClick={act(onDuplicate)}><ListItemIcon><DuplicateIcon fontSize="small" /></ListItemIcon>Nhân bản</MenuItem>
        <MenuItem onClick={act(onExport)}><ListItemIcon><ExportIcon fontSize="small" /></ListItemIcon>Xuất file JSON</MenuItem>
        <MenuItem onClick={act(onDelete)} sx={{ color: '#F87171' }}><ListItemIcon><DeleteIcon fontSize="small" sx={{ color: '#F87171' }} /></ListItemIcon>Xóa</MenuItem>
      </Menu>
    </Box>
  )
}

// ── Details ───────────────────────────────────────────────────────────────────

const DetailsDialog: React.FC<{
  cfg: SavedConfig | null
  paramById: Record<string, Parameter>
  onClose: () => void
  onOpen: (cfg: SavedConfig) => void
}> = ({ cfg, paramById, onClose, onOpen }) => {
  const [showAll, setShowAll] = useState(false)
  if (!cfg) return null
  const meta = configMeta(cfg)
  const key = new Set(meta.outputs)
  const computed = Object.keys(cfg.results).filter(id => !(id in cfg.values))
  const shown = showAll ? computed : computed.filter(id => key.has(id))

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      <Box sx={{ height: 4, bgcolor: meta.accent }} />
      <DialogContent sx={{ p: 3 }}>
        <Stack direction="row" gap={1.5} alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: tint(meta.accent, 0.18), color: meta.accent }}>
            <meta.Icon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{cfg.name}</Typography>
            <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>
              {meta.title}{meta.modeLabel ? ` · ${meta.modeLabel}` : ''} · tạo {formatDateTime(cfg.created_at)} · cập nhật {formatDateTime(cfg.updated_at)}
            </Typography>
          </Box>
        </Stack>
        {cfg.description && <Typography sx={{ fontSize: '0.84rem', color: '#CBD5E1', lineHeight: 1.6, my: 1.5, whiteSpace: 'pre-wrap' }}>{cfg.description}</Typography>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase', color: '#64748B', mb: 1 }}>
              Thông số nhập ({Object.keys(cfg.values).length})
            </Typography>
            {Object.entries(cfg.values).map(([id, v]) => <ValueLine key={id} id={id} value={v} paramById={paramById} color="#93C5FD" />)}
            {cfg.targets.length > 0 && (
              <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary', mt: 1 }}>
                Mục tiêu: {cfg.targets.map(t => labelOf(t, paramById)).join(', ')}
              </Typography>
            )}
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase', color: '#64748B' }}>
                Kết quả khi lưu ({shown.length}{showAll ? '' : `/${computed.length}`})
              </Typography>
              {computed.length > shown.length || showAll
                ? <Button size="small" onClick={() => setShowAll(v => !v)} sx={{ fontSize: '0.7rem', py: 0 }}>{showAll ? 'Chỉ kết quả chính' : 'Xem tất cả'}</Button>
                : null}
            </Stack>
            {shown.length === 0 && <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Không có kết quả nào được tính.</Typography>}
            {shown.map(id => <ValueLine key={id} id={id} value={cfg.results[id]} paramById={paramById} color="#6EE7B7" />)}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Đóng</Button>
        <Button variant="contained" startIcon={<OpenIcon />} onClick={() => onOpen(cfg)}>Mở trong Thiết kế hệ vision</Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Guest ─────────────────────────────────────────────────────────────────────

const GuestState: React.FC = () => {
  const openAuth = useAuthStore(s => s.openAuth)
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', p: 4 }}>
      <Stack alignItems="center" textAlign="center" gap={1.5} sx={{ maxWidth: 460, p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', background: `linear-gradient(160deg, ${tint(ACCENT_CONFIGS, 0.1)} 0%, transparent 60%)` }}>
        <Box sx={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: tint(ACCENT_CONFIGS, 0.15), color: ACCENT_CONFIGS }}>
          <LockIcon sx={{ fontSize: 30 }} />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Lưu và quản lý cấu hình hệ vision</Typography>
        <Typography sx={{ fontSize: '0.84rem', color: '#CBD5E1', lineHeight: 1.6 }}>
          Đăng nhập để lưu các cấu hình camera – lens – chiếu sáng đã tính, mở lại bất cứ lúc nào để thử nghiệm,
          chỉnh sửa và so sánh phương án.
        </Typography>
        <Stack direction="row" gap={1} sx={{ mt: 1 }}>
          <Button variant="contained" onClick={() => openAuth('login')}>Đăng nhập</Button>
          <Button variant="outlined" onClick={() => openAuth('register')}>Tạo tài khoản</Button>
        </Stack>
      </Stack>
    </Stack>
  )
}

// ── Module ────────────────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'all', title: 'Tất cả', accent: ACCENT.blue },
  ...SCENARIOS.map(s => ({ id: s.id, title: s.title, accent: s.accent })),
  { id: FREE_KEY, title: FREE_TITLE, accent: ACCENT.indigo },
]

/** Isolated from ConfigInput so an imported file cannot smuggle extra fields. */
function parseImport(text: string): ConfigInput {
  const raw = JSON.parse(text)
  if (!raw || typeof raw !== 'object' || typeof raw.values !== 'object' || raw.values === null) {
    throw new Error('File không đúng định dạng cấu hình (thiếu "values").')
  }
  const values: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw.values)) if (typeof v === 'number' && isFinite(v)) values[k] = v
  return {
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 120) : 'Cấu hình nhập từ file',
    description: typeof raw.description === 'string' ? raw.description.slice(0, 2000) : '',
    scenario_id: typeof raw.scenario_id === 'string' ? raw.scenario_id : null,
    mode: typeof raw.mode === 'string' ? raw.mode : null,
    values,
    targets: Array.isArray(raw.targets) ? raw.targets.filter((t: unknown) => typeof t === 'string') : [],
  }
}

function downloadJson(cfg: SavedConfig) {
  const { name, description, scenario_id, mode, values, targets, results } = cfg
  const blob = new Blob([JSON.stringify({ name, description, scenario_id, mode, values, targets, results }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 60) || 'config'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** The signed-in user's saved calculator configurations. */
const ConfigsModule: React.FC = () => {
  const user = useAuthStore(s => s.user)
  const ready = useAuthStore(s => s.ready)
  const { openConfig, forget, linked } = useConfigStore()
  const setModule = useNavStore(s => s.setModule)
  const { paramById } = useParameters()
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState<Sort>('updated')
  const [details, setDetails] = useState<SavedConfig | null>(null)
  const [renaming, setRenaming] = useState<SavedConfig | null>(null)
  const [deleting, setDeleting] = useState<SavedConfig | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const { data: configs, isLoading, error, refetch } = useQuery({
    queryKey: ['configs', user?.id],
    queryFn: fetchConfigs,
    enabled: !!user,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['configs'] })
  const notifyError = (err: unknown, fallback: string) => enqueueSnackbar(errorMessage(err, fallback), { variant: 'error' })

  const rename = useMutation({
    mutationFn: ({ id, name, description }: { id: number; name: string; description: string }) => updateConfig(id, { name, description }),
    onSuccess: cfg => {
      invalidate(); setRenaming(null)
      if (Object.values(useConfigStore.getState().linked).some(l => l.id === cfg.id)) useConfigStore.getState().link(cfg)
    },
  })
  const duplicate = useMutation({
    mutationFn: (id: number) => duplicateConfig(id),
    onSuccess: cfg => { invalidate(); enqueueSnackbar(`Đã tạo "${cfg.name}".`, { variant: 'success' }) },
    onError: err => notifyError(err, 'Không nhân bản được.'),
  })
  const remove = useMutation({
    mutationFn: (id: number) => deleteConfig(id),
    onSuccess: (_, id) => { forget(id); invalidate(); setDeleting(null); enqueueSnackbar('Đã xóa cấu hình.', { variant: 'info' }) },
    onError: err => notifyError(err, 'Không xóa được.'),
  })
  const importMut = useMutation({
    mutationFn: (body: ConfigInput) => createConfig(body),
    onSuccess: cfg => { invalidate(); enqueueSnackbar(`Đã nhập "${cfg.name}".`, { variant: 'success' }) },
    onError: err => notifyError(err, 'Không nhập được file.'),
  })

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: configs?.length ?? 0 }
    for (const cfg of configs ?? []) {
      const k = cfg.scenario_id && SCENARIOS.some(s => s.id === cfg.scenario_id) ? cfg.scenario_id : FREE_KEY
      c[k] = (c[k] ?? 0) + 1
    }
    return c
  }, [configs])

  const visible = useMemo(() => {
    const q = foldText(query.trim())
    const list = (configs ?? []).filter(cfg => {
      const k = cfg.scenario_id && SCENARIOS.some(s => s.id === cfg.scenario_id) ? cfg.scenario_id : FREE_KEY
      if (filter !== 'all' && k !== filter) return false
      return !q || foldText(`${cfg.name} ${cfg.description} ${configMeta(cfg).title}`).includes(q)
    })
    const by = {
      updated: (a: SavedConfig, b: SavedConfig) => b.updated_at.localeCompare(a.updated_at),
      created: (a: SavedConfig, b: SavedConfig) => b.created_at.localeCompare(a.created_at),
      name: (a: SavedConfig, b: SavedConfig) => a.name.localeCompare(b.name, 'vi'),
    }[sort]
    return [...list].sort(by)
  }, [configs, query, filter, sort])

  const activeIds = new Set(Object.values(linked).map(l => l.id))

  const onImportFile = async (file: File | undefined) => {
    if (!file) return
    try {
      importMut.mutate(parseImport(await file.text()))
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'File không hợp lệ.', { variant: 'error' })
    }
  }

  const open = (cfg: SavedConfig) => { setDetails(null); openConfig(cfg) }

  let body: React.ReactNode
  if (!ready) {
    body = <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}><CircularProgress /></Stack>
  } else if (!user) {
    body = <GuestState />
  } else if (isLoading) {
    body = <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}><CircularProgress /></Stack>
  } else if (error) {
    body = (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()}>Thử lại</Button>}>
          {errorMessage(error, 'Không tải được danh sách cấu hình.')}
        </Alert>
      </Box>
    )
  } else {
    body = (
      <Box sx={{ height: '100%', overflowY: 'auto', p: { xs: 2, md: 3 } }}>
        {/* Toolbar */}
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} alignItems={{ md: 'center' }} sx={{ mb: 2 }}>
          <TextField
            placeholder="Tìm theo tên, mô tả…" value={query} onChange={e => setQuery(e.target.value)}
            sx={{ ...TEXT_INPUT_SX, width: { md: 320 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
          />
          <Box sx={{ flex: 1 }} />
          <Select value={sort} onChange={e => setSort(e.target.value as Sort)} sx={{ minWidth: 190, fontSize: '0.82rem' }}>
            <MenuItem value="updated">Mới cập nhật trước</MenuItem>
            <MenuItem value="created">Mới tạo trước</MenuItem>
            <MenuItem value="name">Tên A → Z</MenuItem>
          </Select>
        </Stack>
        <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mb: 2.5 }}>
          {FILTERS.filter(f => f.id === 'all' || counts[f.id]).map(f => {
            const on = filter === f.id
            return (
              <Chip
                key={f.id}
                label={`${f.title} · ${counts[f.id] ?? 0}`}
                onClick={() => setFilter(f.id)}
                sx={{
                  height: 28, fontWeight: 600, border: '1px solid',
                  borderColor: on ? tint(f.accent, 0.6) : 'divider',
                  bgcolor: on ? tint(f.accent, 0.18) : 'transparent',
                  color: on ? '#F1F5F9' : 'text.secondary',
                }}
              />
            )
          })}
        </Stack>

        {configs && configs.length === 0 ? (
          <Stack alignItems="center" textAlign="center" gap={1.5} sx={{ py: 8, px: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
            <ConfigsIcon sx={{ fontSize: 44, color: tint(ACCENT_CONFIGS, 0.7) }} />
            <Typography sx={{ fontWeight: 700 }}>Chưa có cấu hình nào</Typography>
            <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary', maxWidth: 440, lineHeight: 1.6 }}>
              Vào <b>Thiết kế hệ vision</b>, chọn bài toán và nhập thông số, rồi bấm <b>Lưu</b> ở góc trên để lưu cấu hình vào đây.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModule('calculator')}>Tạo cấu hình đầu tiên</Button>
          </Stack>
        ) : visible.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.84rem', py: 4, textAlign: 'center' }}>Không có cấu hình phù hợp bộ lọc.</Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
            {visible.map(cfg => (
              <ConfigCard
                key={cfg.id}
                cfg={cfg}
                paramById={paramById}
                active={activeIds.has(cfg.id)}
                onOpen={() => open(cfg)}
                onDetails={() => setDetails(cfg)}
                onRename={() => { rename.reset(); setRenaming(cfg) }}
                onDuplicate={() => duplicate.mutate(cfg.id)}
                onExport={() => downloadJson(cfg)}
                onDelete={() => setDeleting(cfg)}
              />
            ))}
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ModuleHeader
        title="Cấu hình đã lưu"
        subtitle={user ? `${configs?.length ?? 0} cấu hình · mở lại để thử nghiệm và chỉnh sửa` : 'Lưu, mở lại và quản lý các phương án hệ vision'}
        accent={ACCENT_CONFIGS}
        Icon={ConfigsIcon}
      >
        {user && (
          <>
            <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={e => { onImportFile(e.target.files?.[0]); e.target.value = '' }} />
            <Button size="small" variant="outlined" color="inherit" startIcon={<ImportIcon />} onClick={() => fileInput.current?.click()} disabled={importMut.isPending}>
              Nhập JSON
            </Button>
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setModule('calculator')}>Cấu hình mới</Button>
          </>
        )}
      </ModuleHeader>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>{body}</Box>

      <DetailsDialog cfg={details} paramById={paramById} onClose={() => setDetails(null)} onOpen={open} />

      <ConfigFormDialog
        open={!!renaming}
        title="Đổi tên & mô tả"
        submitLabel="Lưu"
        initialName={renaming?.name}
        initialDescription={renaming?.description}
        busy={rename.isPending}
        error={rename.error ? errorMessage(rename.error, 'Không lưu được.') : null}
        onClose={() => setRenaming(null)}
        onSubmit={(name, description) => renaming && rename.mutate({ id: renaming.id, name, description })}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Xóa cấu hình?"
        message={<>Cấu hình <b>{deleting?.name}</b> sẽ bị xóa vĩnh viễn.</>}
        confirmLabel="Xóa"
        danger
        busy={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </Box>
  )
}

export default ConfigsModule
