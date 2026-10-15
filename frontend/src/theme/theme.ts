import { createTheme, alpha } from '@mui/material/styles'

const PRIMARY = '#3B82F6'    // blue-500
const SECONDARY = '#10B981'  // emerald-500

/** Per-module accent colours used by the navigation rail and module headers. */
export const ACCENT = {
  blue:    '#3B82F6',
  indigo:  '#6366F1',
  violet:  '#8B5CF6',
  pink:    '#EC4899',
  amber:   '#F59E0B',
  emerald: '#10B981',
  cyan:    '#06B6D4',
  rose:    '#F43F5E',
} as const

/** Soft tinted background for an accent colour (cards, chips, icon tiles). */
export const tint = (color: string, opacity = 0.12): string => alpha(color, opacity)

export const MONO_FONT = '"JetBrains Mono", "Fira Code", monospace'

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: PRIMARY },
    secondary: { main: SECONDARY },
    background: {
      default: '#0B0E14',
      paper: '#141822',
    },
    divider: 'rgba(148,163,184,0.12)',
    text: {
      primary: '#E2E8F0',
      secondary: '#94A3B8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontSize: 13,
    h4: { fontWeight: 700, letterSpacing: -0.5 },
    h5: { fontWeight: 700, letterSpacing: -0.3 },
    h6: { fontWeight: 600, letterSpacing: 0.2 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    body2: { fontSize: '0.8rem' },
    caption: { fontSize: '0.72rem', color: '#64748B' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' },
        '*::-webkit-scrollbar': { width: 8, height: 8 },
        '*::-webkit-scrollbar-thumb': { background: '#2A3343', borderRadius: 4 },
        '*::-webkit-scrollbar-thumb:hover': { background: '#3B4659' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', border: '1px solid rgba(148,163,184,0.10)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontSize: '0.7rem', height: 22, fontWeight: 500 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontSize: '0.84rem',
            fontFamily: MONO_FONT,
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
        containedPrimary: {
          background: `linear-gradient(135deg, ${PRIMARY} 0%, #6366F1 100%)`,
          boxShadow: `0 4px 14px ${alpha(PRIMARY, 0.35)}`,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          '&.Mui-selected': {
            background: alpha(PRIMARY, 0.18),
            color: '#BFDBFE',
            '&:hover': { background: alpha(PRIMARY, 0.26) },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: 'rgba(148,163,184,0.12)' } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: '0.74rem', maxWidth: 340, background: '#1E2533', border: '1px solid rgba(148,163,184,0.2)' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '&.Mui-selected': {
            background: alpha(PRIMARY, 0.15),
            '&:hover': { background: alpha(PRIMARY, 0.22) },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          background: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          border: '1px solid rgba(148,163,184,0.10)',
          borderRadius: '8px !important',
          marginBottom: 4,
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: { minHeight: 36, '&.Mui-expanded': { minHeight: 36 } },
        content: { margin: '6px 0', '&.Mui-expanded': { margin: '6px 0' } },
      },
    },
  },
})

export const STATUS_COLORS = {
  unknown: '#475569',
  input: '#3B82F6',
  calculated: '#10B981',
  inverse: '#8B5CF6',
  target: '#F59E0B',
  missing: '#EF4444',
} as const
