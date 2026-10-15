import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box, Button, ButtonBase, Collapse, MenuItem, Paper, Select, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material'
import {
  MenuBook as DocsIcon,
  RestartAlt as ResetIcon,
  Tune as AdvancedIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Memory as SensorIcon,
} from '@mui/icons-material'
import type { CalculationResponse, Parameter, ParameterGroup } from '@/types'
import { runCalculation } from '@/services/api'
import { errorMessage } from '@/services/http'
import { useCalcStore } from '@/stores/calculationStore'
import { useNavStore } from '@/stores/navStore'
import { tint } from '@/theme/theme'
import PresetField from './PresetField'
import ResultsPanel from './ResultsPanel'
import { PARAM_LABELS_VI } from './paramLabels'
import { SCENARIOS, type Scenario, type ScenarioSection, type Values } from './scenarios'
import { AREA_SENSORS, LINE_SENSORS } from './sensors'

const CUSTOM_SENSOR = '__custom__'

/** Inputs sent to the engine: the scenario's fields visible in *mode* that have a value. */
function visibleInputs(scenario: Scenario, mode: string, values: Values): Values {
  const out: Values = {}
  for (const section of scenario.sections) {
    for (const field of section.fields) {
      if (field.modes && !field.modes.includes(mode)) continue
      const v = values[field.id]
      if (typeof v === 'number' && isFinite(v)) out[field.id] = v
    }
  }
  return out
}

const SensorPicker: React.FC<{
  kind: 'area' | 'line'
  values: Values
  onPick: (patch: Values) => void
}> = ({ kind, values, onPick }) => {
  const list = kind === 'area' ? AREA_SENSORS : LINE_SENSORS
  const match = list.find(s =>
    s.resolution_x === values.resolution_x &&
    s.pixel_size === values.pixel_size &&
    (kind === 'line' || s.resolution_y === values.resolution_y))
  return (
    <Box sx={{ gridColumn: '1 / -1' }}>
      <Stack direction="row" alignItems="center" gap={0.5} sx={{ mb: 0.5 }}>
        <SensorIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#CBD5E1' }}>Cảm biến phổ biến</Typography>
      </Stack>
      <Select
        fullWidth
        value={match?.id ?? CUSTOM_SENSOR}
        onChange={e => {
          const s = list.find(x => x.id === e.target.value)
          if (!s) return
          const patch: Values = { resolution_x: s.resolution_x, pixel_size: s.pixel_size }
          if (s.resolution_y) patch.resolution_y = s.resolution_y
          onPick(patch)
        }}
        renderValue={id => {
          const s = list.find(x => x.id === id)
          return s
            ? <Typography sx={{ fontSize: '0.84rem' }}>{s.label} <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>· {s.format}</Box></Typography>
            : <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary' }}>Tùy chỉnh (nhập bên dưới)</Typography>
        }}
      >
        {list.map(s => (
          <MenuItem key={s.id} value={s.id} sx={{ fontSize: '0.82rem', gap: 1 }}>
            <Box sx={{ flex: 1 }}>{s.label}</Box>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontFamily: '"JetBrains Mono", monospace' }}>
              {s.resolution_y ? `${s.resolution_x}×${s.resolution_y}` : `${s.resolution_x} px`} · {s.pixel_size} µm · {s.format}
            </Typography>
          </MenuItem>
        ))}
        <MenuItem value={CUSTOM_SENSOR} sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>Tùy chỉnh (nhập bên dưới)</MenuItem>
      </Select>
    </Box>
  )
}

const SectionCard: React.FC<{
  section: ScenarioSection
  mode: string
  accent: string
  values: Values
  paramById: Record<string, Parameter>
  setValues: (patch: Values | ((v: Values) => Values)) => void
}> = ({ section, mode, accent, values, paramById, setValues }) => {
  const fields = section.fields.filter(f => !f.modes || f.modes.includes(mode))
  return (
    <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(20,24,34,0.7)' }}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.75 }}>
        <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: tint(accent, 0.15), color: accent }}>
          <section.Icon sx={{ fontSize: 17 }} />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>{section.title}</Typography>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.75 }}>
        {section.sensorPicker && (
          <SensorPicker kind={section.sensorPicker} values={values} onPick={patch => setValues(v => ({ ...v, ...patch }))} />
        )}
        {fields.map(field => {
          const param = paramById[field.id]
          if (!param) return null
          return (
            <PresetField
              key={field.id}
              param={param}
              label={PARAM_LABELS_VI[field.id] ?? param.name}
              hint={field.hint}
              value={typeof values[field.id] === 'number' ? values[field.id] : null}
              accent={accent}
              onChange={val => setValues(v => {
                const next = { ...v }
                if (val === null) delete next[field.id]
                else next[field.id] = val
                return next
              })}
            />
          )
        })}
      </Box>
    </Paper>
  )
}

interface ScenarioViewProps {
  groups: ParameterGroup[]
  onOpenAdvanced: () => void
}

/** Guided calculator: pick a vision problem, fill in a few inputs, read checks and results. */
const ScenarioView: React.FC<ScenarioViewProps> = ({ groups, onOpenAdvanced }) => {
  const { scenarioId: requestedId, openDoc, consumeScenario } = useNavStore()
  const [scenarioId, setScenarioId] = useState(requestedId ?? SCENARIOS[0].id)
  const [modes, setModes] = useState<Record<string, string>>({})
  const [valuesById, setValuesById] = useState<Record<string, Values>>({})
  const [guideOpen, setGuideOpen] = useState(true)

  // Deep link from Docs ("Thử trong Calculator").
  useEffect(() => {
    if (!requestedId) return
    setScenarioId(requestedId)
    consumeScenario()
  }, [requestedId, consumeScenario])

  const scenario = SCENARIOS.find(s => s.id === scenarioId) ?? SCENARIOS[0]
  const mode = modes[scenario.id] ?? scenario.modes[0].id
  const values = valuesById[scenario.id] ?? scenario.defaults

  const setValues = (patch: Values | ((v: Values) => Values)) =>
    setValuesById(all => {
      const cur = all[scenario.id] ?? scenario.defaults
      return { ...all, [scenario.id]: typeof patch === 'function' ? patch(cur) : patch }
    })

  const paramById = useMemo(() => {
    const map: Record<string, Parameter> = {}
    for (const g of groups) for (const p of g.parameters) map[p.id] = p
    return map
  }, [groups])

  const inputs = useMemo(() => visibleInputs(scenario, mode, values), [scenario, mode, values])

  // Debounced auto-calculation; ignore responses from superseded requests.
  const [result, setResult] = useState<CalculationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reqId = useRef(0)
  useEffect(() => {
    const id = ++reqId.current
    setLoading(true)
    const timer = setTimeout(() => {
      runCalculation({ known_values: inputs, targets: [] })
        .then(r => { if (id === reqId.current) { setResult(r); setError(null) } })
        .catch(err => { if (id === reqId.current) setError(errorMessage(err, 'Không gọi được API tính toán.')) })
        .finally(() => { if (id === reqId.current) setLoading(false) })
    }, 300)
    return () => clearTimeout(timer)
  }, [inputs])

  const openAdvanced = async () => {
    const store = useCalcStore.getState()
    store.clearAll()
    for (const [k, v] of Object.entries(inputs)) store.setParamValue(k, v)
    onOpenAdvanced()
    await store.calculate()
  }

  const modeInfo = scenario.modes.find(m => m.id === mode)

  return (
    <Box
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '240px 1fr', xl: '260px minmax(0,1fr) 420px' },
        overflow: { xs: 'auto', md: 'hidden' },
      }}
    >
      {/* Scenario list */}
      <Box sx={{ borderRight: '1px solid', borderColor: 'divider', overflowY: 'auto', p: 1.5, bgcolor: 'rgba(11,14,20,0.6)' }}>
        <Typography sx={{ px: 0.5, mb: 1, fontSize: '0.66rem', fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: '#64748B' }}>
          Chọn bài toán
        </Typography>
        <Stack gap={1}>
          {SCENARIOS.map(s => {
            const active = s.id === scenario.id
            return (
              <ButtonBase
                key={s.id}
                onClick={() => setScenarioId(s.id)}
                sx={{
                  display: 'flex', alignItems: 'flex-start', gap: 1.25, p: 1.25, borderRadius: 2, textAlign: 'left',
                  border: '1px solid', borderColor: active ? tint(s.accent, 0.6) : 'divider',
                  background: active ? `linear-gradient(135deg, ${tint(s.accent, 0.2)} 0%, ${tint(s.accent, 0.04)} 100%)` : 'transparent',
                  boxShadow: active ? `0 6px 20px ${tint(s.accent, 0.18)}` : 'none',
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: tint(s.accent, 0.5), bgcolor: tint(s.accent, 0.06) },
                }}
              >
                <Box sx={{ width: 34, height: 34, flexShrink: 0, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: active ? s.accent : tint(s.accent, 0.15), color: active ? '#fff' : s.accent }}>
                  <s.Icon sx={{ fontSize: 19 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.84rem', fontWeight: 700 }}>{s.title}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.35 }}>{s.subtitle}</Typography>
                </Box>
              </ButtonBase>
            )
          })}
        </Stack>
        <Box sx={{ mt: 2, p: 1.25, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '0.74rem', fontWeight: 600, mb: 0.5 }}>Bài toán khác?</Typography>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 1 }}>
            Chế độ nâng cao cho phép nhập bất kỳ thông số nào và xem đồ thị phụ thuộc.
          </Typography>
          <Button size="small" variant="outlined" startIcon={<AdvancedIcon />} onClick={onOpenAdvanced} fullWidth>
            Chế độ nâng cao
          </Button>
        </Box>
      </Box>

      {/* Inputs */}
      <Box sx={{ overflowY: { md: 'auto' }, p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} alignItems={{ lg: 'flex-start' }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
          <Stack direction="row" gap={1.5} alignItems="center">
            <Box sx={{ width: 46, height: 46, flexShrink: 0, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${scenario.accent} 0%, ${tint(scenario.accent, 0.5)} 100%)`, boxShadow: `0 8px 24px ${tint(scenario.accent, 0.35)}` }}>
              <scenario.Icon sx={{ fontSize: 26, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontSize: '1.35rem' }}>{scenario.title}</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{scenario.subtitle}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Button size="small" variant="outlined" startIcon={<DocsIcon />} onClick={() => openDoc(scenario.docId)}>Tài liệu</Button>
            <Tooltip title="Khôi phục giá trị mặc định của bài toán">
              <Button size="small" variant="outlined" color="inherit" startIcon={<ResetIcon />} onClick={() => setValues(scenario.defaults)}>Đặt lại</Button>
            </Tooltip>
            <Tooltip title="Mở các thông số hiện tại trong chế độ nâng cao">
              <Button size="small" variant="outlined" color="inherit" startIcon={<AdvancedIcon />} onClick={openAdvanced}>Nâng cao</Button>
            </Tooltip>
          </Stack>
        </Stack>

        <Typography sx={{ fontSize: '0.84rem', color: '#CBD5E1', lineHeight: 1.6, mb: 2, maxWidth: 820 }}>
          {scenario.description}
        </Typography>

        {/* Guide */}
        <Paper sx={{ mb: 2, borderRadius: 2, bgcolor: tint(scenario.accent, 0.05), borderColor: tint(scenario.accent, 0.25) }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1, cursor: 'pointer' }} onClick={() => setGuideOpen(o => !o)}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: scenario.accent }}>Hướng dẫn nhanh</Typography>
            {guideOpen ? <CollapseIcon sx={{ fontSize: 18 }} /> : <ExpandIcon sx={{ fontSize: 18 }} />}
          </Stack>
          <Collapse in={guideOpen}>
            <Stack gap={0.75} sx={{ px: 2, pb: 1.5 }}>
              {scenario.guide.map((g, i) => (
                <Stack key={i} direction="row" gap={1.25} alignItems="flex-start">
                  <Box sx={{ width: 20, height: 20, flexShrink: 0, borderRadius: '50%', bgcolor: tint(scenario.accent, 0.2), color: scenario.accent, fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {i + 1}
                  </Box>
                  <Typography sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>{g}</Typography>
                </Stack>
              ))}
            </Stack>
          </Collapse>
        </Paper>

        {/* Mode */}
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            exclusive size="small" value={mode}
            onChange={(_, m) => m && setModes(all => ({ ...all, [scenario.id]: m }))}
            sx={{ flexWrap: 'wrap' }}
          >
            {scenario.modes.map(m => (
              <ToggleButton key={m.id} value={m.id} sx={{ px: 1.75, fontSize: '0.78rem' }}>{m.label}</ToggleButton>
            ))}
          </ToggleButtonGroup>
          {modeInfo && <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary', mt: 0.75 }}>{modeInfo.hint}</Typography>}
        </Box>

        <Stack gap={2}>
          {scenario.sections.map(section => (
            <SectionCard
              key={section.title}
              section={section}
              mode={mode}
              accent={scenario.accent}
              values={values}
              paramById={paramById}
              setValues={setValues}
            />
          ))}
        </Stack>

        {/* Results below inputs on narrower screens */}
        <Box sx={{ display: { xs: 'block', xl: 'none' }, mt: 3 }}>
          <ResultsPanel scenario={scenario} mode={mode} inputs={inputs} result={result} loading={loading} error={error} paramById={paramById} />
        </Box>
      </Box>

      {/* Results column */}
      <Box sx={{ display: { xs: 'none', xl: 'block' }, borderLeft: '1px solid', borderColor: 'divider', overflowY: 'auto', p: 2.5, bgcolor: 'rgba(11,14,20,0.6)' }}>
        <ResultsPanel scenario={scenario} mode={mode} inputs={inputs} result={result} loading={loading} error={error} paramById={paramById} />
      </Box>
    </Box>
  )
}

export default ScenarioView
