import React from 'react'
import { Box, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import {
  Calculate as ExampleIcon,
  Functions as FormulaIcon,
  InfoOutlined as InfoIcon,
  LightbulbOutlined as TipIcon,
  WarningAmberRounded as WarnIcon,
} from '@mui/icons-material'
import { TONE } from '@/theme/status'
import { ACCENT, MONO_FONT, tint } from '@/theme/theme'
import type { DocBlock } from './types'

/** Render **bold** and `code` spans inside a text string. */
export const Inline: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return <Box key={i} component="strong" sx={{ color: '#F1F5F9', fontWeight: 700 }}>{p.slice(2, -2)}</Box>
        }
        if (p.startsWith('`') && p.endsWith('`')) {
          return (
            <Box key={i} component="code" sx={{ fontFamily: MONO_FONT, fontSize: '0.86em', px: 0.6, py: 0.1, borderRadius: 0.75, bgcolor: 'rgba(148,163,184,0.14)', color: '#E0E7FF' }}>
              {p.slice(1, -1)}
            </Box>
          )
        }
        return <React.Fragment key={i}>{p}</React.Fragment>
      })}
    </>
  )
}

const CALLOUT = {
  tip:  { color: TONE.success, Icon: TipIcon,  title: 'Mẹo' },
  warn: { color: TONE.warning, Icon: WarnIcon, title: 'Lưu ý' },
  info: { color: TONE.info,    Icon: InfoIcon, title: 'Thông tin' },
} as const

const bodySx = { fontSize: '0.9rem', lineHeight: 1.75, color: '#CBD5E1' }

const Block: React.FC<{ block: DocBlock }> = ({ block }) => {
  switch (block.type) {
    case 'p':
      return <Typography sx={bodySx}><Inline text={block.text} /></Typography>

    case 'h':
      return (
        <Typography variant="h6" sx={{ fontSize: '1.08rem', fontWeight: 700, mt: 2, color: '#F1F5F9' }}>
          {block.text}
        </Typography>
      )

    case 'list':
      return (
        <Box component={block.ordered ? 'ol' : 'ul'} sx={{ ...bodySx, pl: 3, my: 0, '& li': { mb: 0.5 }, '& li::marker': { color: ACCENT.indigo, fontWeight: 700 } }}>
          {block.items.map((it, i) => <li key={i}><Inline text={it} /></li>)}
        </Box>
      )

    case 'formula':
      return (
        <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: tint(ACCENT.indigo, 0.35), background: `linear-gradient(135deg, ${tint(ACCENT.indigo, 0.12)} 0%, ${tint(ACCENT.indigo, 0.03)} 100%)`, overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" gap={1} sx={{ px: 2, pt: 1.25 }}>
            <FormulaIcon sx={{ fontSize: 16, color: ACCENT.indigo }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#A5B4FC' }}>
              {block.title ?? 'Công thức'}
            </Typography>
          </Stack>
          <Typography sx={{ px: 2, py: 1.25, fontFamily: MONO_FONT, fontSize: '1rem', fontWeight: 600, color: '#EEF2FF', whiteSpace: 'pre-wrap' }}>
            {block.expr}
          </Typography>
          {block.where && (
            <Box sx={{ px: 2, pb: 1.5, display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: 1.5, rowGap: 0.4 }}>
              {block.where.map(([sym, desc]) => (
                <React.Fragment key={sym}>
                  <Typography sx={{ fontFamily: MONO_FONT, fontSize: '0.8rem', color: '#C7D2FE' }}>{sym}</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8' }}><Inline text={desc} /></Typography>
                </React.Fragment>
              ))}
            </Box>
          )}
          {block.note && (
            <Typography sx={{ px: 2, py: 1, fontSize: '0.78rem', color: '#A5B4FC', borderTop: '1px solid', borderColor: tint(ACCENT.indigo, 0.2) }}>
              <Inline text={block.note} />
            </Typography>
          )}
        </Box>
      )

    case 'example':
      return (
        <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: tint(ACCENT.emerald, 0.35), bgcolor: tint(ACCENT.emerald, 0.05), overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" gap={1} sx={{ px: 2, py: 1.25, bgcolor: tint(ACCENT.emerald, 0.1) }}>
            <ExampleIcon sx={{ fontSize: 17, color: ACCENT.emerald }} />
            <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: '#A7F3D0' }}>Ví dụ tính toán: {block.title}</Typography>
          </Stack>
          <Box sx={{ px: 2, pt: 1.5 }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#64748B', mb: 0.75 }}>Dữ kiện</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {block.given.map(([k, v]) => (
                <Box key={k} sx={{ px: 1.25, py: 0.5, borderRadius: 1.5, bgcolor: 'rgba(148,163,184,0.08)', border: '1px solid', borderColor: 'divider' }}>
                  <Typography component="span" sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>{k} = </Typography>
                  <Typography component="span" sx={{ fontSize: '0.78rem', fontFamily: MONO_FONT, color: '#E2E8F0' }}>{v}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
          <Box sx={{ px: 2, pt: 1.75, pb: 1 }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#64748B', mb: 0.75 }}>Các bước</Typography>
            <Stack gap={1}>
              {block.steps.map(([desc, calc], i) => (
                <Stack key={i} direction="row" gap={1.25} alignItems="flex-start">
                  <Box sx={{ width: 22, height: 22, flexShrink: 0, borderRadius: '50%', bgcolor: tint(ACCENT.emerald, 0.2), color: ACCENT.emerald, fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.2 }}>
                    {i + 1}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.84rem', color: '#CBD5E1' }}><Inline text={desc} /></Typography>
                    <Typography sx={{ fontFamily: MONO_FONT, fontSize: '0.82rem', color: '#6EE7B7', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{calc}</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>
          <Box sx={{ mx: 2, mb: 1.75, mt: 0.5, p: 1.25, borderRadius: 1.5, bgcolor: tint(ACCENT.emerald, 0.12), border: '1px solid', borderColor: tint(ACCENT.emerald, 0.3) }}>
            <Typography sx={{ fontSize: '0.84rem', color: '#ECFDF5' }}>
              <Box component="span" sx={{ fontWeight: 700, color: ACCENT.emerald }}>Kết luận: </Box>
              <Inline text={block.result} />
            </Typography>
          </Box>
        </Box>
      )

    case 'table':
      return (
        <Box>
          <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(148,163,184,0.08)' }}>
                  {block.head.map(h => (
                    <TableCell key={h} sx={{ fontSize: '0.76rem', fontWeight: 700, color: '#E2E8F0', whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {block.rows.map((r, i) => (
                  <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 }, '&:hover': { bgcolor: 'rgba(148,163,184,0.04)' } }}>
                    {r.map((c, j) => (
                      <TableCell key={j} sx={{ fontSize: '0.8rem', color: j === 0 ? '#E2E8F0' : '#CBD5E1', fontWeight: j === 0 ? 600 : 400, verticalAlign: 'top' }}>
                        <Inline text={c} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          {block.caption && <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary', mt: 0.75 }}>{block.caption}</Typography>}
        </Box>
      )

    case 'callout': {
      const c = CALLOUT[block.tone]
      return (
        <Stack direction="row" gap={1.25} sx={{ p: 1.5, borderRadius: 2, bgcolor: tint(c.color, 0.08), border: '1px solid', borderColor: tint(c.color, 0.3) }}>
          <c.Icon sx={{ fontSize: 20, color: c.color, mt: 0.15 }} />
          <Box>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: c.color }}>{block.title ?? c.title}</Typography>
            <Typography sx={{ fontSize: '0.84rem', lineHeight: 1.65, color: '#CBD5E1' }}><Inline text={block.text} /></Typography>
          </Box>
        </Stack>
      )
    }
  }
}

const DocRenderer: React.FC<{ blocks: DocBlock[] }> = ({ blocks }) => (
  <Stack gap={2}>
    {blocks.map((b, i) => <Block key={i} block={b} />)}
  </Stack>
)

export default DocRenderer
