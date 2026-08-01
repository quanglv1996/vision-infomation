import React, { useState } from 'react'
import {
  Box, Chip, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, Tooltip, Typography,
} from '@mui/material'
import type { ComparisonResult, ImageMetrics } from '@/types/imageComparison'

interface Props { result: ComparisonResult; colors: string[] }

type SortKey = keyof Pick<ImageMetrics,
  'rank' | 'overall_score' | 'sharpness_score' | 'laplacian_variance' |
  'noise_score' | 'noise_std' | 'contrast_score' | 'rms_contrast' |
  'brightness_score' | 'mean_brightness' | 'snr_db' | 'entropy'
>

const COLS: { key: SortKey; label: string; higher?: boolean; decimals?: number }[] = [
  { key: 'rank',               label: 'Rank',          higher: false,  decimals: 0 },
  { key: 'overall_score',      label: 'Overall',       higher: true,   decimals: 1 },
  { key: 'sharpness_score',    label: 'Sharpness',     higher: true,   decimals: 1 },
  { key: 'laplacian_variance', label: 'Laplacian',     higher: true,   decimals: 1 },
  { key: 'noise_score',        label: 'Noise Score',   higher: true,   decimals: 1 },
  { key: 'noise_std',          label: 'Noise σ%',      higher: false,  decimals: 4 },
  { key: 'contrast_score',     label: 'Contrast',      higher: true,   decimals: 1 },
  { key: 'rms_contrast',       label: 'RMS Contrast',  higher: true,   decimals: 4 },
  { key: 'brightness_score',   label: 'Brightness',    higher: true,   decimals: 1 },
  { key: 'mean_brightness',    label: 'Mean Bright%',  higher: false,  decimals: 1 },
  { key: 'snr_db',             label: 'SNR (dB)',      higher: true,   decimals: 2 },
  { key: 'entropy',            label: 'Entropy',       higher: true,   decimals: 3 },
]

const dl = (content: string, filename: string, mime: string) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type: mime }))
  a.download = filename; a.click(); URL.revokeObjectURL(a.href)
}

const SummaryTable: React.FC<Props> = ({ result, colors }) => {
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...result.metrics].sort((a, b) => {
    const diff = (a[sortKey] as number) - (b[sortKey] as number)
    return sortDir === 'asc' ? diff : -diff
  })

  const bestVal = (key: SortKey, higher = true) => {
    const vals = result.metrics.map(m => m[key] as number)
    return higher ? Math.max(...vals) : Math.min(...vals)
  }

  const exportCsv = () => {
    const header = ['Name', ...COLS.map(c => c.label)].join(',')
    const rows = result.metrics.map(m =>
      [m.name, ...COLS.map(c => m[c.key])].join(',')
    )
    dl([header, ...rows].join('\n'), 'comparison.csv', 'text/csv')
  }

  const exportJson = () =>
    dl(JSON.stringify(result.metrics, null, 2), 'comparison.json', 'application/json')

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" color="text.secondary">
          Comparison Results — {result.n_images} images
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip label="Export CSV"  size="small" variant="outlined" onClick={exportCsv}  sx={{ cursor: 'pointer' }} />
          <Chip label="Export JSON" size="small" variant="outlined" onClick={exportJson} sx={{ cursor: 'pointer' }} />
        </Stack>
      </Stack>

      {/* Best / Worst callout */}
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Chip
          label={`🏆 Best: ${result.metrics[result.best_idx].name}`}
          size="small" sx={{ bgcolor: '#10B98122', color: '#10B981', fontWeight: 700 }}
        />
        <Chip
          label={`⚠ Worst: ${result.metrics[result.worst_idx].name}`}
          size="small" sx={{ bgcolor: '#EF444422', color: '#EF4444', fontWeight: 700 }}
        />
      </Stack>

      <TableContainer sx={{ maxHeight: 400 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: 'background.paper', fontSize: '0.72rem', fontWeight: 700, minWidth: 90 }}>Image</TableCell>
              {COLS.map(col => (
                <TableCell key={col.key} sx={{ bgcolor: 'background.paper', fontSize: '0.7rem' }}>
                  <TableSortLabel
                    active={sortKey === col.key}
                    direction={sortKey === col.key ? sortDir : 'asc'}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((m, rowIdx) => {
              const origIdx = result.metrics.findIndex(x => x.index === m.index)
              const color = colors[origIdx % colors.length]
              return (
                <TableRow key={m.index} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Box sx={{ width: 8, height: 24, borderRadius: 0.5, bgcolor: color, flexShrink: 0 }} />
                      <Tooltip title={m.name}>
                        <Typography variant="caption" sx={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {m.name}
                        </Typography>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  {COLS.map(col => {
                    const v = m[col.key] as number
                    const best = bestVal(col.key, col.higher)
                    const isBest = Math.abs(v - best) < 1e-6
                    return (
                      <TableCell key={col.key} sx={{ fontFamily: 'monospace', fontSize: '0.72rem',
                        color: isBest ? '#10B981' : 'text.primary', fontWeight: isBest ? 700 : 400 }}>
                        {col.decimals === 0 ? v : v.toFixed(col.decimals)}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default SummaryTable
