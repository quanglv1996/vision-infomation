import React, { useEffect, useState } from 'react'
import { Box, ButtonBase, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import {
  KeyboardDoubleArrowLeft as CollapseIcon,
  KeyboardDoubleArrowRight as ExpandIcon,
} from '@mui/icons-material'
import { MODULES, type AppModule } from '@/modules'
import { useNavStore } from '@/stores/navStore'
import { tint } from '@/theme/theme'

const RAIL_OPEN = 228
const RAIL_CLOSED = 68

const NavItem: React.FC<{ module: AppModule; active: boolean; open: boolean; onClick: () => void }> = ({
  module: { label, caption, accent, Icon }, active, open, onClick,
}) => (
  <Tooltip title={open ? '' : label} placement="right">
    <ButtonBase
      onClick={onClick}
      sx={{
        width: '100%',
        justifyContent: 'flex-start',
        gap: 1.25,
        px: 1.25,
        py: 0.9,
        borderRadius: 2,
        position: 'relative',
        bgcolor: active ? tint(accent, 0.14) : 'transparent',
        transition: 'background 0.15s',
        '&:hover': { bgcolor: active ? tint(accent, 0.18) : 'rgba(148,163,184,0.08)' },
        '&::before': active ? {
          content: '""', position: 'absolute', left: -10, top: 8, bottom: 8, width: 3,
          borderRadius: 2, bgcolor: accent,
        } : {},
      }}
    >
      <Box
        sx={{
          width: 32, height: 32, flexShrink: 0, borderRadius: 1.5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: active ? accent : tint(accent, 0.14),
          color: active ? '#fff' : accent,
          boxShadow: active ? `0 4px 12px ${tint(accent, 0.45)}` : 'none',
          transition: 'all 0.15s',
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      {open && (
        <Box sx={{ minWidth: 0, textAlign: 'left' }}>
          <Typography noWrap sx={{ fontSize: '0.82rem', fontWeight: 600, color: active ? 'text.primary' : '#CBD5E1' }}>
            {label}
          </Typography>
          <Typography noWrap sx={{ fontSize: '0.66rem', color: 'text.secondary' }}>
            {caption}
          </Typography>
        </Box>
      )}
    </ButtonBase>
  </Tooltip>
)

const App: React.FC = () => {
  const { moduleId, setModule } = useNavStore()
  const [open, setOpen] = useState(true)

  const active = MODULES.find(m => m.id === moduleId) ?? MODULES[0]
  const groups = [...new Set(MODULES.map(m => m.group))]

  // Keep visited modules mounted so uploads and results survive tab switches.
  const [visited, setVisited] = useState<Set<string>>(() => new Set([active.id]))
  useEffect(() => {
    setVisited(v => (v.has(active.id) ? v : new Set(v).add(active.id)))
  }, [active.id])

  return (
    <Box sx={{ height: '100vh', display: 'flex', overflow: 'hidden', bgcolor: 'background.default' }}>
      {/* Navigation rail */}
      <Box
        component="nav"
        sx={{
          width: open ? RAIL_OPEN : RAIL_CLOSED,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(180deg, #111623 0%, #0B0E14 100%)',
          transition: 'width 0.2s',
          overflow: 'hidden',
        }}
      >
        {/* Brand */}
        <Stack direction="row" alignItems="center" gap={1.25} sx={{ px: 2, height: 60, flexShrink: 0 }}>
          <Box
            sx={{
              width: 34, height: 34, flexShrink: 0, borderRadius: 2,
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 55%, #EC4899 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.72rem', fontWeight: 800, color: '#fff', letterSpacing: 0.5,
              boxShadow: '0 6px 18px rgba(99,102,241,0.45)',
            }}
          >
            MV
          </Box>
          {open && (
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: 0.2 }}>
                Vision Studio
              </Typography>
              <Typography noWrap sx={{ fontSize: '0.66rem', color: 'text.secondary' }}>
                Machine vision toolkit
              </Typography>
            </Box>
          )}
        </Stack>

        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 1.25, pb: 2 }}>
          {groups.map(group => (
            <Box key={group} sx={{ mt: 1.5 }}>
              {open ? (
                <Typography sx={{ px: 1.25, mb: 0.5, fontSize: '0.64rem', fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: '#64748B' }}>
                  {group}
                </Typography>
              ) : (
                <Box sx={{ mx: 1.5, mb: 1, borderTop: '1px solid', borderColor: 'divider' }} />
              )}
              <Stack gap={0.25}>
                {MODULES.filter(m => m.group === group).map(m => (
                  <NavItem key={m.id} module={m} active={m.id === active.id} open={open} onClick={() => setModule(m.id)} />
                ))}
              </Stack>
            </Box>
          ))}
        </Box>

        <Stack
          direction="row" alignItems="center" justifyContent={open ? 'space-between' : 'center'}
          sx={{ px: 1.5, height: 44, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}
        >
          {open && <Typography variant="caption">v1.1.0</Typography>}
          <IconButton size="small" onClick={() => setOpen(v => !v)} aria-label={open ? 'Thu gọn menu' : 'Mở rộng menu'}>
            {open ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
          </IconButton>
        </Stack>
      </Box>

      {/* Active module */}
      <Box component="main" sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {MODULES.filter(m => visited.has(m.id) || m.id === active.id).map(({ id, Component }) => (
          <Box key={id} sx={{ height: '100%', display: id === active.id ? 'block' : 'none' }}>
            <Component />
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default App
