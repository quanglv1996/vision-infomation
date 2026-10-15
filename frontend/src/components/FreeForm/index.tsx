import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, ButtonBase, Chip, Dialog, IconButton, InputAdornment,
  LinearProgress, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'
import {
  AccountTree as GraphIcon,
  CameraAlt as CameraIcon,
  Category as ObjectIcon,
  CenterFocusWeak as LensIcon,
  Close as CloseIcon,
  DeleteSweep as ClearIcon,
  DirectionsRun as MotionIcon,
  ExpandMore as ExpandMoreIcon,
  Flare as OpticsIcon,
  Functions as FormulaIcon,
  GpsFixed as TargetIcon,
  GridOn as ImagingIcon,
  Highlight as LightIcon,
  Rule as InspectIcon,
  Search as SearchIcon,
  Tune as FreeIcon,
} from '@mui/icons-material'
import { TEXT_INPUT_SX } from '@/components/Auth/AuthDialog'
import SaveConfigButton from '@/components/Configs/SaveConfigButton'
import DependencyGraph from '@/components/DependencyGraph'
import Recommendations from '@/components/Recommendations'
import PresetField from '@/components/Scenarios/PresetField'
import { SectionTitle } from '@/components/Scenarios/ResultsPanel'
import StepList, { labelOf, StepItem } from '@/components/Scenarios/StepList'
import { SCENARIOS } from '@/components/Scenarios/scenarios'
import { runCalculation } from '@/services/api'
import { errorMessage } from '@/services/http'
import { useConfigStore } from '@/stores/configStore'
import { useFreeFormStore } from '@/stores/freeFormStore'
import { TONE } from '@/theme/status'
import { ACCENT, MONO_FONT, STATUS_COLORS, tint } from '@/theme/theme'
import type { CalculationResponse, CalculationStep, Parameter, ParameterGroup } from '@/types'
import { foldText, formatNumber } from '@/utils/format'

const ACCENT_FREE = ACCENT.indigo

const CATEGORY: Record<string, { label: string; Icon: SvgIconComponent; accent: string }> = {
  Camera:     { label: 'Camera',             Icon: CameraIcon,  accent: ACCENT.blue },
  Lens:       { label: 'Lens',               Icon: LensIcon,    accent: ACCENT.violet },
  Object:     { label: 'Vật cần chụp',       Icon: ObjectIcon,  accent: ACCENT.amber },
  Motion:     { label: 'Chuyển động',        Icon: MotionIcon,  accent: ACCENT.rose },
  Imaging:    { label: 'Ảnh & độ phân giải', Icon: ImagingIcon, accent: ACCENT.emerald },
  Optics:     { label: 'Quang học',          Icon: OpticsIcon,  accent: ACCENT.cyan },
  Lighting:   { label: 'Chiếu sáng',         Icon: LightIcon,   accent: ACCENT.amber },
  Inspection: { label: 'Kiểm tra & đo',      Icon: InspectIcon, accent: ACCENT.pink },
}
const categoryOf = (c: string) => CATEGORY[c] ?? { label: c, Icon: FreeIcon, accent: ACCENT_FREE }

type Show = 'all' | 'known'

// ── Field ─────────────────────────────────────────────────────────────────────

interface FieldProps {
  param: Parameter
  value: number | null
  step: CalculationStep | undefined
  isTarget: boolean
  missing: boolean
  selected: boolean
  onChange: (v: number | null) => void
  onToggleTarget: () => void
  onSelect: () => void
}

const Field: React.FC<FieldProps> = ({ param, value, step, isTarget, missing, selected, onChange, onToggleTarget, onSelect }) => {
  const derived = value === null && step && step.status !== 'input' ? step : undefined
  const color = value !== null ? STATUS_COLORS.input
    : derived ? STATUS_COLORS.calculated
      : isTarget ? STATUS_COLORS.target
        : missing ? STATUS_COLORS.missing
          : null
  return (
    <Box
      sx={{
        p: 1.25, borderRadius: 2, position: 'relative',
        border: '1px solid', borderColor: selected ? tint(color ?? ACCENT_FREE, 0.8) : color ? tint(color, 0.35) : 'divider',
        bgcolor: color ? tint(color, 0.05) : 'rgba(148,163,184,0.02)',
        transition: 'border-color 0.15s',
      }}
    >
      <PresetField
        param={param}
        label={labelOf(param.id, { [param.id]: param })}
        value={value}
        accent={ACCENT_FREE}
        onChange={onChange}
        placeholder={derived ? `= ${formatNumber(derived.value)}` : undefined}
        headerExtra={
          <Tooltip title={isTarget ? 'Bỏ mục tiêu' : 'Đặt làm mục tiêu — xem cần thêm thông số gì để tính được'}>
            <IconButton size="small" onClick={onToggleTarget} sx={{ p: 0.25, color: isTarget ? STATUS_COLORS.target : 'text.secondary', opacity: isTarget ? 1 : 0.6 }}>
              <TargetIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        }
      />
      {derived && (
        <ButtonBase onClick={onSelect} sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-start', gap: 0.5, borderRadius: 1, maxWidth: '100%' }}>
          <FormulaIcon sx={{ fontSize: 13, color: STATUS_COLORS.calculated }} />
          <Typography noWrap sx={{ fontSize: '0.68rem', color: '#6EE7B7' }}>
            Tính được{derived.formula_name ? ` · ${derived.formula_name}` : ''}
          </Typography>
        </ButtonBase>
      )}
      {!derived && value === null && isTarget && (
        <Typography sx={{ mt: 0.5, fontSize: '0.68rem', color: STATUS_COLORS.target }}>Mục tiêu — chưa đủ dữ liệu</Typography>
      )}
      {!derived && value === null && !isTarget && missing && (
        <Typography sx={{ mt: 0.5, fontSize: '0.68rem', color: '#FCA5A5' }}>Cần cho mục tiêu</Typography>
      )}
    </Box>
  )
}

// ── Results column ────────────────────────────────────────────────────────────

const ResultsColumn: React.FC<{
  result: CalculationResponse | null
  loading: boolean
  error: string | null
  values: Record<string, number>
  targets: string[]
  selected: string | null
  paramById: Record<string, Parameter>
  onSelect: (id: string | null) => void
}> = ({ result, loading, error, values, targets, selected, paramById, onSelect }) => {
  const steps = result ? Object.values(result.steps).filter(s => s.status !== 'input') : []
  const warnings = (result?.warnings ?? []).filter(w => w.kind !== 'performance')
  const sel = selected ? result?.steps[selected] : undefined

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1, height: 2 }}>{loading && <LinearProgress sx={{ height: 2 }} />}</Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2.5 }}>
        {[
          ['Đã nhập', Object.keys(values).length, STATUS_COLORS.input],
          ['Tính được', steps.length, STATUS_COLORS.calculated],
          ['Cảnh báo', warnings.length, warnings.length ? TONE.warning : '#64748B'],
        ].map(([label, n, c]) => (
          <Box key={label as string} sx={{ p: 1.25, borderRadius: 2, border: '1px solid', borderColor: tint(c as string, 0.35), bgcolor: tint(c as string, 0.08) }}>
            <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: c as string, lineHeight: 1.1, fontFamily: MONO_FONT }}>{n}</Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{label}</Typography>
          </Box>
        ))}
      </Box>

      {sel && selected && (
        <Paper sx={{ p: 1.75, mb: 2.5, borderRadius: 2, borderColor: tint(ACCENT_FREE, 0.4), bgcolor: tint(ACCENT_FREE, 0.06) }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, flex: 1 }}>Cách tính: {labelOf(selected, paramById)}</Typography>
            <IconButton size="small" onClick={() => onSelect(null)}><CloseIcon sx={{ fontSize: 16 }} /></IconButton>
          </Stack>
          <StepItem step={sel} accent={ACCENT_FREE} paramById={paramById} />
          {paramById[selected]?.description && (
            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 1 }}>{paramById[selected].description}</Typography>
          )}
        </Paper>
      )}

      {targets.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <SectionTitle>Mục tiêu</SectionTitle>
          <Stack gap={0.75}>
            {targets.map(t => {
              const v = result?.all_values[t]
              const missing = result?.missing_for_targets[t] ?? []
              const ok = typeof v === 'number'
              return (
                <Box key={t} sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid', borderColor: tint(ok ? TONE.success : STATUS_COLORS.target, 0.3), bgcolor: tint(ok ? TONE.success : STATUS_COLORS.target, 0.06) }}>
                  <Stack direction="row" justifyContent="space-between" gap={1}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{labelOf(t, paramById)}</Typography>
                    {ok && <Typography sx={{ fontFamily: MONO_FONT, fontSize: '0.82rem', fontWeight: 700, color: TONE.success }}>{formatNumber(v)} {paramById[t]?.unit}</Typography>}
                  </Stack>
                  {!ok && (
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.25 }}>
                      {missing.length ? `Cần thêm một trong: ${missing.map(m => labelOf(m, paramById)).join(', ')}` : 'Chưa tính được từ dữ liệu hiện có.'}
                    </Typography>
                  )}
                </Box>
              )
            })}
          </Stack>
        </Box>
      )}

      {warnings.length > 0 && (
        <Stack gap={1} sx={{ mb: 2.5 }}>
          {warnings.map((w, i) => (
            <Alert key={i} severity={w.severity === 'error' ? 'error' : 'warning'} sx={{ fontSize: '0.74rem', py: 0 }}>{w.message}</Alert>
          ))}
        </Stack>
      )}

      {result && (
        <Box sx={{ mb: 2.5 }}>
          <Recommendations values={result.all_values} accent={ACCENT_FREE} />
        </Box>
      )}

      {steps.length > 0 && (
        <Accordion disableGutters defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}>
            <Stack direction="row" alignItems="center" gap={1}>
              <FormulaIcon sx={{ fontSize: 18, color: ACCENT_FREE }} />
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>Cách tính từng bước ({steps.length})</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <StepList steps={steps} accent={ACCENT_FREE} paramById={paramById} />
          </AccordionDetails>
        </Accordion>
      )}

      {!result && !loading && !error && Object.keys(values).length === 0 && (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>Nhập ít nhất một thông số để bắt đầu.</Typography>
      )}
    </Box>
  )
}

// ── View ──────────────────────────────────────────────────────────────────────

interface FreeFormViewProps {
  groups: ParameterGroup[]
  paramById: Record<string, Parameter>
}

/** "Nâng cao": enter any known parameters; the engine derives the rest. */
const FreeFormView: React.FC<FreeFormViewProps> = ({ groups, paramById }) => {
  const { values, targets, setValue, toggleTarget, load, clear } = useFreeFormStore()
  const pending = useConfigStore(s => s.pending)
  const [show, setShow] = useState<Show>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [graphOpen, setGraphOpen] = useState(false)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Saved config without a (known) scenario → open it here.
  useEffect(() => {
    if (!pending || (pending.scenario_id && SCENARIOS.some(s => s.id === pending.scenario_id))) return
    const store = useConfigStore.getState()
    load(pending.values, pending.targets)
    store.link({ ...pending, scenario_id: null })
    store.consume()
  }, [pending, load])

  // Debounced auto-calculation; responses from superseded requests are dropped.
  const [result, setResult] = useState<CalculationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reqId = useRef(0)
  useEffect(() => {
    const id = ++reqId.current
    if (Object.keys(values).length === 0) { setResult(null); setLoading(false); setError(null); return }
    setLoading(true)
    const timer = setTimeout(() => {
      runCalculation({ known_values: values, targets })
        .then(r => { if (id === reqId.current) { setResult(r); setError(null) } })
        .catch(err => { if (id === reqId.current) setError(errorMessage(err, 'Không gọi được API tính toán.')) })
        .finally(() => { if (id === reqId.current) setLoading(false) })
    }, 300)
    return () => clearTimeout(timer)
  }, [values, targets])

  const missing = useMemo(() => new Set(Object.values(result?.missing_for_targets ?? {}).flat()), [result])
  const computed = result?.all_values ?? {}

  const q = foldText(query.trim())
  const visibleGroups = groups.map(g => ({
    ...g,
    parameters: g.parameters.filter(p => {
      if (show === 'known' && !(p.id in computed) && !(p.id in values) && !targets.includes(p.id)) return false
      return !q || foldText(`${labelOf(p.id, paramById)} ${p.name} ${p.id}`).includes(q)
    }),
  })).filter(g => g.parameters.length > 0)

  const scrollTo = (cat: string) => sectionRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const results = (
    <ResultsColumn
      result={result} loading={loading} error={error} values={values} targets={targets}
      selected={selected} paramById={paramById} onSelect={setSelected}
    />
  )

  return (
    <Box
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '230px 1fr', xl: '230px minmax(0,1fr) 420px' },
        overflow: { xs: 'auto', md: 'hidden' },
      }}
    >
      {/* Category navigator */}
      <Box sx={{ borderRight: '1px solid', borderColor: 'divider', overflowY: 'auto', p: 1.5, bgcolor: 'rgba(11,14,20,0.6)' }}>
        <Typography sx={{ px: 0.5, mb: 1, fontSize: '0.66rem', fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: '#64748B' }}>
          Nhóm thông số
        </Typography>
        <Stack gap={0.5}>
          {groups.map(g => {
            const info = categoryOf(g.category)
            const entered = g.parameters.filter(p => p.id in values).length
            const derived = g.parameters.filter(p => !(p.id in values) && p.id in computed).length
            return (
              <ButtonBase
                key={g.category}
                onClick={() => scrollTo(g.category)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1, borderRadius: 2, textAlign: 'left', '&:hover': { bgcolor: tint(info.accent, 0.08) } }}
              >
                <Box sx={{ width: 30, height: 30, flexShrink: 0, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: tint(info.accent, 0.15), color: info.accent }}>
                  <info.Icon sx={{ fontSize: 17 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{info.label}</Typography>
                  <Typography sx={{ fontSize: '0.66rem', color: 'text.secondary' }}>
                    {g.parameters.length} thông số
                    {entered > 0 && <Box component="span" sx={{ color: STATUS_COLORS.input }}> · {entered} nhập</Box>}
                    {derived > 0 && <Box component="span" sx={{ color: STATUS_COLORS.calculated }}> · {derived} tính</Box>}
                  </Typography>
                </Box>
              </ButtonBase>
            )
          })}
        </Stack>

        <Box sx={{ mt: 2, p: 1.25, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, mb: 0.75 }}>Chú thích</Typography>
          {[
            [STATUS_COLORS.input, 'Giá trị bạn nhập'],
            [STATUS_COLORS.calculated, 'Hệ thống tính được'],
            [STATUS_COLORS.target, 'Mục tiêu cần tính'],
            [STATUS_COLORS.missing, 'Còn thiếu cho mục tiêu'],
          ].map(([c, t]) => (
            <Stack key={t} direction="row" alignItems="center" gap={0.75} sx={{ py: 0.25 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c }} />
              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{t}</Typography>
            </Stack>
          ))}
        </Box>
      </Box>

      {/* Inputs */}
      <Box sx={{ overflowY: { md: 'auto' }, p: { xs: 2, md: 3 } }}>
        <Stack gap={1.5} sx={{ mb: 2 }}>
          <Stack direction="row" gap={1.5} alignItems="center">
            <Box sx={{ width: 46, height: 46, flexShrink: 0, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${ACCENT_FREE} 0%, ${tint(ACCENT_FREE, 0.5)} 100%)`, boxShadow: `0 8px 24px ${tint(ACCENT_FREE, 0.35)}` }}>
              <FreeIcon sx={{ fontSize: 26, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontSize: '1.35rem' }}>Tính toán tự do</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Nhập bất kỳ thông số nào bạn biết — hệ thống tự suy ra phần còn lại</Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
            <SaveConfigButton scenarioId={null} mode={null} values={values} targets={targets} suggestedName="Cấu hình tự do" />
            <Button size="small" variant="outlined" startIcon={<GraphIcon />} onClick={() => setGraphOpen(true)}>Đồ thị phụ thuộc</Button>
            <Tooltip title="Xóa mọi giá trị và mục tiêu">
              <span>
                <Button size="small" variant="outlined" color="inherit" startIcon={<ClearIcon />} disabled={!Object.keys(values).length && !targets.length}
                  onClick={() => { clear(); setSelected(null) }}>
                  Xóa hết
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2.5 }}>
          <TextField
            placeholder="Tìm thông số (VD: tiêu cự, DOF, pixel)…" value={query} onChange={e => setQuery(e.target.value)}
            sx={{ ...TEXT_INPUT_SX, flex: 1, maxWidth: { sm: 420 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
          />
          <ToggleButtonGroup exclusive size="small" value={show} onChange={(_, v: Show | null) => v && setShow(v)}>
            <ToggleButton value="all" sx={{ px: 1.5, fontSize: '0.76rem' }}>Tất cả thông số</ToggleButton>
            <ToggleButton value="known" sx={{ px: 1.5, fontSize: '0.76rem' }}>Chỉ đã có giá trị</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack gap={2}>
          {visibleGroups.map(g => {
            const info = categoryOf(g.category)
            return (
              <Paper key={g.category} ref={(el: HTMLDivElement | null) => { sectionRefs.current[g.category] = el }} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(20,24,34,0.7)', scrollMarginTop: 16 }}>
                <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.75 }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: tint(info.accent, 0.15), color: info.accent }}>
                    <info.Icon sx={{ fontSize: 17 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>{info.label}</Typography>
                  <Chip size="small" label={g.parameters.length} sx={{ height: 18, fontSize: '0.64rem' }} />
                </Stack>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 1.25 }}>
                  {g.parameters.map(p => (
                    <Field
                      key={p.id}
                      param={p}
                      value={typeof values[p.id] === 'number' ? values[p.id] : null}
                      step={result?.steps[p.id]}
                      isTarget={targets.includes(p.id)}
                      missing={missing.has(p.id)}
                      selected={selected === p.id}
                      onChange={v => setValue(p.id, v)}
                      onToggleTarget={() => toggleTarget(p.id)}
                      onSelect={() => setSelected(p.id)}
                    />
                  ))}
                </Box>
              </Paper>
            )
          })}
          {visibleGroups.length === 0 && (
            <Typography sx={{ color: 'text.secondary', fontSize: '0.84rem', textAlign: 'center', py: 4 }}>
              {show === 'known' ? 'Chưa có thông số nào có giá trị.' : 'Không tìm thấy thông số phù hợp.'}
            </Typography>
          )}
        </Stack>

        <Box sx={{ display: { xs: 'block', xl: 'none' }, mt: 3 }}>{results}</Box>
      </Box>

      {/* Results */}
      <Box sx={{ display: { xs: 'none', xl: 'block' }, borderLeft: '1px solid', borderColor: 'divider', overflowY: 'auto', p: 2.5, bgcolor: 'rgba(11,14,20,0.6)' }}>
        {results}
      </Box>

      <Dialog open={graphOpen} onClose={() => setGraphOpen(false)} fullWidth maxWidth={false} PaperProps={{ sx: { height: '88vh', width: '94vw', overflow: 'hidden' } }}>
        <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <GraphIcon sx={{ color: ACCENT_FREE, mr: 1 }} />
          <Typography sx={{ fontWeight: 700, flex: 1 }}>Đồ thị phụ thuộc giữa các thông số</Typography>
          <IconButton size="small" onClick={() => setGraphOpen(false)}><CloseIcon fontSize="small" /></IconButton>
        </Stack>
        <Box sx={{ flex: 1, height: 'calc(88vh - 52px)' }}>
          {graphOpen && <DependencyGraph groups={groups} values={values} computed={computed} targets={targets} />}
        </Box>
      </Dialog>
    </Box>
  )
}

export default FreeFormView
