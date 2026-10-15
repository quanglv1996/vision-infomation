import React from 'react'
import { Box, Stack, Typography } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'
import { tint } from '@/theme/theme'

interface ModuleHeaderProps {
  title: string
  subtitle?: string
  accent: string
  Icon: SvgIconComponent
  /** Right-aligned actions. */
  children?: React.ReactNode
}

/** 56 px module title bar: accent icon tile, title, subtitle, actions. */
const ModuleHeader: React.FC<ModuleHeaderProps> = ({ title, subtitle, accent, Icon, children }) => (
  <Stack
    direction="row" alignItems="center" gap={1.5}
    sx={{ px: 2.5, minHeight: 56, py: 1, flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexWrap: 'wrap' }}
  >
    <Box sx={{ width: 34, height: 34, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: tint(accent, 0.15), color: accent, flexShrink: 0 }}>
      <Icon sx={{ fontSize: 20 }} />
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.98rem', lineHeight: 1.2 }}>{title}</Typography>
      {subtitle && <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{subtitle}</Typography>}
    </Box>
    <Box sx={{ flex: 1 }} />
    {children && <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">{children}</Stack>}
  </Stack>
)

export default ModuleHeader
