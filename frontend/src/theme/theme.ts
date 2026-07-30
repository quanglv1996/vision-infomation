import { createTheme, alpha } from '@mui/material/styles'

const PRIMARY = '#3B82F6'    // blue-500
const SECONDARY = '#10B981'  // emerald-500

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: PRIMARY },
    secondary: { main: SECONDARY },
    background: {
      default: '#0F1117',
      paper: '#1A1D27',
    },
    divider: 'rgba(255,255,255,0.08)',
    text: {
      primary: '#E2E8F0',
      secondary: '#94A3B8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontSize: 13,
    h6: { fontWeight: 600, letterSpacing: 0.3 },
    body2: { fontSize: '0.78rem' },
    caption: { fontSize: '0.72rem', color: '#64748B' },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' },
        '*::-webkit-scrollbar': { width: 6 },
        '*::-webkit-scrollbar-thumb': { background: '#334155', borderRadius: 3 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.06)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontSize: '0.7rem', height: 20 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontSize: '0.82rem',
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 4 },
        containedPrimary: {
          background: `linear-gradient(135deg, ${PRIMARY} 0%, #6366F1 100%)`,
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: 'rgba(255,255,255,0.08)' } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: '0.72rem', maxWidth: 320 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          '&.Mui-selected': {
            background: alpha(PRIMARY, 0.15),
            '&:hover': { background: alpha(PRIMARY, 0.22) },
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          background: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '6px !important',
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
