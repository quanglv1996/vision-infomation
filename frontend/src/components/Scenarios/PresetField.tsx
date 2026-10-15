import React, { useEffect, useRef, useState } from 'react'
import {
  Box, IconButton, InputAdornment, ListSubheader, MenuItem, Select, Stack, TextField, Tooltip, Typography,
} from '@mui/material'
import {
  Backspace as ClearIcon,
  EditOutlined as EditIcon,
  FormatListBulleted as ListIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material'
import type { Parameter } from '@/types'
import { formatNumber } from '@/utils/format'

const CUSTOM = '__custom__'
const CLEAR = '__clear__'

interface PresetFieldProps {
  param: Parameter
  label: string
  hint?: string
  value: number | null
  accent: string
  onChange: (value: number | null) => void
  /** Shown while empty (e.g. the value the engine derived). */
  placeholder?: string
  /** Extra controls at the right of the label row. */
  headerExtra?: React.ReactNode
}

const sameValue = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b))

/**
 * Numeric input with quick picks: a dropdown of the parameter's common values
 * plus "Khác…" which switches to free entry. Parameters without presets are
 * always free entry.
 */
const PresetField: React.FC<PresetFieldProps> = ({ param, label, hint, value, accent, onChange, placeholder, headerExtra }) => {
  const presets = param.presets ?? []
  const matchIdx = value === null ? -1 : presets.findIndex(p => sameValue(p.value, value))
  const [custom, setCustom] = useState(presets.length === 0 || (value !== null && matchIdx < 0))
  const [text, setText] = useState(value === null ? '' : String(value))

  // Values this field emitted itself; anything else came from outside
  // (scenario switch, sensor picker, reset) and re-syncs text and mode.
  const emitted = useRef<{ v: number | null } | null>(null)
  const emit = (v: number | null) => { emitted.current = { v }; onChange(v) }

  useEffect(() => {
    const own = emitted.current
    emitted.current = null
    if (own && (own.v === value || (own.v !== null && value !== null && sameValue(own.v, value)))) return
    setText(value === null ? '' : String(value))
    if (presets.length > 0 && value !== null) setCustom(!presets.some(p => sameValue(p.value, value)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const unit = param.unit

  const handleText = (raw: string) => {
    setText(raw)
    const trimmed = raw.trim().replace(',', '.')
    if (trimmed === '') { emit(null); return }
    const num = parseFloat(trimmed)
    if (!isNaN(num) && isFinite(num)) emit(num)
  }

  const header = (
    <Stack direction="row" alignItems="center" gap={0.5} sx={{ mb: 0.5 }}>
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#CBD5E1' }}>{label}</Typography>
      {unit && <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>({unit})</Typography>}
      {(hint || param.description) && (
        <Tooltip
          title={
            <Box>
              {hint && <Typography sx={{ fontSize: '0.76rem', mb: 0.5 }}>{hint}</Typography>}
              <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8' }}>{param.name}: {param.description}</Typography>
            </Box>
          }
          placement="top-start"
        >
          <InfoIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'help' }} />
        </Tooltip>
      )}
      {headerExtra && <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>{headerExtra}</Box>}
    </Stack>
  )

  if (custom) {
    return (
      <Box>
        {header}
        <TextField
          fullWidth
          value={text}
          onChange={e => handleText(e.target.value)}
          placeholder={placeholder ?? 'Nhập giá trị…'}
          inputProps={{ inputMode: 'decimal' }}
          sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: accent } }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {unit && <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mr: presets.length ? 0.5 : 0 }}>{unit}</Typography>}
                {presets.length > 0 && (
                  <Tooltip title="Chọn từ giá trị phổ biến">
                    <IconButton size="small" edge="end" onClick={() => setCustom(false)}>
                      <ListIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </InputAdornment>
            ),
          }}
        />
      </Box>
    )
  }

  return (
    <Box>
      {header}
      <Select
        fullWidth
        value={matchIdx >= 0 ? String(matchIdx) : ''}
        displayEmpty
        onChange={e => {
          const v = e.target.value
          if (v === CUSTOM) { setCustom(true); return }
          if (v === CLEAR) { setText(''); emit(null); return }
          emit(presets[Number(v)].value)
        }}
        renderValue={sel => {
          if (sel === '') return <Typography noWrap sx={{ fontSize: '0.84rem', color: 'text.secondary' }}>{placeholder ?? 'Chọn…'}</Typography>
          const p = presets[Number(sel)]
          return (
            <Stack direction="row" alignItems="baseline" gap={0.75}>
              <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.84rem' }}>
                {formatNumber(p.value, 6)}{unit ? ` ${unit}` : ''}
              </Typography>
              {p.label && <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }} noWrap>{p.label}</Typography>}
            </Stack>
          )
        }}
        sx={{ '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: accent } }}
        MenuProps={{ PaperProps: { sx: { maxHeight: 360 } } }}
      >
        <ListSubheader sx={{ fontSize: '0.68rem', lineHeight: '28px', bgcolor: 'background.paper' }}>
          Giá trị phổ biến
        </ListSubheader>
        {presets.map((p, i) => (
          <MenuItem key={i} value={String(i)} sx={{ fontSize: '0.82rem', gap: 1 }}>
            <Box component="span" sx={{ fontFamily: '"JetBrains Mono", monospace', minWidth: 72 }}>
              {formatNumber(p.value, 6)}{unit ? ` ${unit}` : ''}
            </Box>
            {p.label && <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>{p.label}</Box>}
          </MenuItem>
        ))}
        <MenuItem value={CUSTOM} sx={{ fontSize: '0.82rem', gap: 1, borderTop: '1px solid', borderColor: 'divider', color: accent }}>
          <EditIcon sx={{ fontSize: 16 }} /> Khác… (nhập giá trị)
        </MenuItem>
        {value !== null && (
          <MenuItem value={CLEAR} sx={{ fontSize: '0.82rem', gap: 1, color: 'text.secondary' }}>
            <ClearIcon sx={{ fontSize: 16 }} /> Bỏ trống
          </MenuItem>
        )}
      </Select>
    </Box>
  )
}

export default PresetField
