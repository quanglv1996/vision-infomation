import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box, Button, ButtonBase, Chip, Divider, InputAdornment, Stack, TextField, Typography,
} from '@mui/material'
import {
  ArrowBack as PrevIcon,
  ArrowForward as NextIcon,
  AutoAwesome as TryIcon,
  Home as HomeIcon,
  Launch as ModuleIcon,
  Search as SearchIcon,
  Article as ArticleIcon,
} from '@mui/icons-material'
import { useNavStore } from '@/stores/navStore'
import { MODULES } from '@/modules'
import { ACCENT, tint } from '@/theme/theme'
import DocRenderer from './DocRenderer'
import { ARTICLES, ARTICLE_BY_ID, DOC_CATEGORIES } from './content'
import type { DocArticle, DocBlock } from './types'

/** Lower-case, strip Vietnamese diacritics — so "do sau" matches "độ sâu". */
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

const blockText = (b: DocBlock): string => {
  switch (b.type) {
    case 'p': case 'h': return b.text
    case 'list': return b.items.join(' ')
    case 'formula': return [b.title, b.expr, b.note, ...(b.where ?? []).flat()].join(' ')
    case 'example': return [b.title, b.result, ...b.given.flat(), ...b.steps.flat()].join(' ')
    case 'table': return [b.caption, ...b.head, ...b.rows.flat()].join(' ')
    case 'callout': return [b.title, b.text].join(' ')
  }
}

const SEARCH_INDEX: Record<string, string> = Object.fromEntries(
  ARTICLES.map(a => [a.id, fold([a.title, a.summary, ...a.blocks.map(blockText)].join(' '))]),
)

const categoryOf = (name: string) => DOC_CATEGORIES.find(c => c.name === name) ?? DOC_CATEGORIES[0]

const countBlocks = (a: DocArticle, type: DocBlock['type']) => a.blocks.filter(b => b.type === type).length

const ArticleCard: React.FC<{ article: DocArticle; onOpen: () => void }> = ({ article, onOpen }) => {
  const cat = categoryOf(article.category)
  return (
    <ButtonBase
      onClick={onOpen}
      sx={{
        display: 'block', textAlign: 'left', p: 2, borderRadius: 2,
        border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(20,24,34,0.7)',
        transition: 'all 0.15s',
        '&:hover': { borderColor: tint(cat.accent, 0.6), transform: 'translateY(-2px)', boxShadow: `0 10px 24px ${tint(cat.accent, 0.15)}` },
      }}
    >
      <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', mb: 0.5 }}>{article.title}</Typography>
      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', lineHeight: 1.5, mb: 1.25 }}>{article.summary}</Typography>
      <Stack direction="row" gap={0.75} flexWrap="wrap">
        {countBlocks(article, 'formula') > 0 && (
          <Chip size="small" label={`${countBlocks(article, 'formula')} công thức`} sx={{ bgcolor: tint(ACCENT.indigo, 0.15), color: '#A5B4FC' }} />
        )}
        {countBlocks(article, 'example') > 0 && (
          <Chip size="small" label={`${countBlocks(article, 'example')} ví dụ`} sx={{ bgcolor: tint(ACCENT.emerald, 0.15), color: '#6EE7B7' }} />
        )}
        {article.scenarioId && <Chip size="small" label="Có bài toán" sx={{ bgcolor: tint(ACCENT.amber, 0.15), color: '#FCD34D' }} />}
      </Stack>
    </ButtonBase>
  )
}

const Landing: React.FC<{ onOpen: (id: string) => void }> = ({ onOpen }) => {
  const formulas = ARTICLES.reduce((n, a) => n + countBlocks(a, 'formula'), 0)
  const examples = ARTICLES.reduce((n, a) => n + countBlocks(a, 'example'), 0)
  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Box
        sx={{
          p: { xs: 3, md: 4 }, mb: 4, borderRadius: 3, position: 'relative', overflow: 'hidden',
          border: '1px solid', borderColor: tint(ACCENT.indigo, 0.35),
          background: `radial-gradient(circle at 85% 20%, ${tint(ACCENT.pink, 0.25)} 0%, transparent 40%), linear-gradient(135deg, ${tint(ACCENT.indigo, 0.35)} 0%, ${tint(ACCENT.blue, 0.12)} 60%, transparent 100%)`,
        }}
      >
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, mb: 1 }}>Thư viện kiến thức Machine Vision</Typography>
        <Typography sx={{ color: '#CBD5E1', maxWidth: 680, lineHeight: 1.7, mb: 2.5 }}>
          Hướng dẫn chi tiết và cách tính toán cho thiết kế hệ vision, các bài toán chụp ảnh và
          những kỹ thuật hiệu chuẩn được dùng trong ứng dụng. Mỗi bài có công thức, giải thích ký hiệu và ví dụ tính từng bước.
        </Typography>
        <Stack direction="row" gap={3} flexWrap="wrap">
          {[[ARTICLES.length, 'bài viết'], [formulas, 'công thức'], [examples, 'ví dụ tính toán']].map(([n, l]) => (
            <Box key={l as string}>
              <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }}>{n}</Typography>
              <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary' }}>{l}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {DOC_CATEGORIES.map(cat => (
        <Box key={cat.name} sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" gap={1.25} sx={{ mb: 1.5 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: tint(cat.accent, 0.18), color: cat.accent }}>
              <cat.Icon sx={{ fontSize: 19 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1.02rem' }}>{cat.name}</Typography>
              <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>{cat.description}</Typography>
            </Box>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1.5 }}>
            {ARTICLES.filter(a => a.category === cat.name).map(a => (
              <ArticleCard key={a.id} article={a} onOpen={() => onOpen(a.id)} />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

const ArticleView: React.FC<{ article: DocArticle; onOpen: (id: string) => void }> = ({ article, onOpen }) => {
  const { openScenario, setModule } = useNavStore()
  const cat = categoryOf(article.category)
  const idx = ARTICLES.findIndex(a => a.id === article.id)
  const prev = ARTICLES[idx - 1]
  const next = ARTICLES[idx + 1]
  const module = article.moduleId ? MODULES.find(m => m.id === article.moduleId) : undefined

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto' }}>
      <Chip
        size="small"
        icon={<cat.Icon sx={{ fontSize: '14px !important', color: `${cat.accent} !important` }} />}
        label={article.category}
        sx={{ mb: 1.5, bgcolor: tint(cat.accent, 0.15), color: cat.accent, fontWeight: 600 }}
      />
      <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '1.9rem' }, mb: 1 }}>{article.title}</Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', lineHeight: 1.6, mb: 2 }}>{article.summary}</Typography>

      {(article.scenarioId || module) && (
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {article.scenarioId && (
            <Button variant="contained" size="small" startIcon={<TryIcon />} onClick={() => openScenario(article.scenarioId!)}>
              Tính thử trong ứng dụng
            </Button>
          )}
          {module && (
            <Button variant="outlined" size="small" startIcon={<ModuleIcon />} onClick={() => setModule(module.id)}>
              Mở module {module.label}
            </Button>
          )}
        </Stack>
      )}

      <Divider sx={{ mb: 3 }} />
      <DocRenderer blocks={article.blocks} />

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 5, mb: 3 }}>
        {prev ? (
          <ButtonBase onClick={() => onOpen(prev.id)} sx={{ display: 'block', textAlign: 'left', p: 1.75, borderRadius: 2, border: '1px solid', borderColor: 'divider', '&:hover': { borderColor: 'primary.main' } }}>
            <Stack direction="row" alignItems="center" gap={0.5} sx={{ color: 'text.secondary', mb: 0.5 }}>
              <PrevIcon sx={{ fontSize: 14 }} /><Typography sx={{ fontSize: '0.7rem' }}>Bài trước</Typography>
            </Stack>
            <Typography sx={{ fontSize: '0.84rem', fontWeight: 600 }}>{prev.title}</Typography>
          </ButtonBase>
        ) : <Box />}
        {next ? (
          <ButtonBase onClick={() => onOpen(next.id)} sx={{ display: 'block', textAlign: 'right', p: 1.75, borderRadius: 2, border: '1px solid', borderColor: 'divider', '&:hover': { borderColor: 'primary.main' } }}>
            <Stack direction="row" alignItems="center" justifyContent="flex-end" gap={0.5} sx={{ color: 'text.secondary', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.7rem' }}>Bài tiếp</Typography><NextIcon sx={{ fontSize: 14 }} />
            </Stack>
            <Typography sx={{ fontSize: '0.84rem', fontWeight: 600 }}>{next.title}</Typography>
          </ButtonBase>
        ) : <Box />}
      </Box>
    </Box>
  )
}

/** Knowledge base: machine-vision fundamentals, scenario guides and calibration techniques. */
const DocsModule: React.FC = () => {
  const { docId, openDoc } = useNavStore()
  const [query, setQuery] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  const article = docId ? ARTICLE_BY_ID[docId] : undefined

  useEffect(() => { contentRef.current?.scrollTo({ top: 0 }) }, [docId])

  const matches = useMemo(() => {
    const q = fold(query.trim())
    if (!q) return null
    const terms = q.split(/\s+/)
    return new Set(ARTICLES.filter(a => terms.every(t => SEARCH_INDEX[a.id].includes(t))).map(a => a.id))
  }, [query])

  const open = (id: string | null) => {
    if (id) openDoc(id)
    else useNavStore.setState({ docId: null })
  }

  return (
    <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px 1fr' }, overflow: 'hidden' }}>
      {/* Sidebar */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider', bgcolor: 'rgba(11,14,20,0.6)', overflow: 'hidden' }}>
        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Tìm: DOF, encoder, ΔE…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'inherit' } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
          />
          {matches && <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.75, px: 0.5 }}>{matches.size} bài phù hợp</Typography>}
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
          <ButtonBase
            onClick={() => open(null)}
            sx={{ width: '100%', justifyContent: 'flex-start', gap: 1, px: 1.25, py: 0.9, borderRadius: 1.5, bgcolor: !article ? tint(ACCENT.indigo, 0.15) : 'transparent', '&:hover': { bgcolor: tint(ACCENT.indigo, 0.1) } }}
          >
            <HomeIcon sx={{ fontSize: 17, color: ACCENT.indigo }} />
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>Trang chủ tài liệu</Typography>
          </ButtonBase>
          {DOC_CATEGORIES.map(cat => {
            const items = ARTICLES.filter(a => a.category === cat.name && (!matches || matches.has(a.id)))
            if (!items.length) return null
            return (
              <Box key={cat.name} sx={{ mt: 2 }}>
                <Stack direction="row" alignItems="center" gap={0.75} sx={{ px: 1.25, mb: 0.5 }}>
                  <cat.Icon sx={{ fontSize: 14, color: cat.accent }} />
                  <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase', color: '#64748B' }}>{cat.name}</Typography>
                </Stack>
                {items.map(a => {
                  const active = a.id === article?.id
                  return (
                    <ButtonBase
                      key={a.id}
                      onClick={() => open(a.id)}
                      sx={{
                        width: '100%', justifyContent: 'flex-start', textAlign: 'left', gap: 1, px: 1.25, py: 0.75, borderRadius: 1.5,
                        bgcolor: active ? tint(cat.accent, 0.15) : 'transparent',
                        color: active ? '#F1F5F9' : '#CBD5E1',
                        '&:hover': { bgcolor: active ? tint(cat.accent, 0.2) : 'rgba(148,163,184,0.08)' },
                      }}
                    >
                      <ArticleIcon sx={{ fontSize: 15, color: active ? cat.accent : '#475569' }} />
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: active ? 600 : 400, lineHeight: 1.35 }}>{a.title}</Typography>
                    </ButtonBase>
                  )
                })}
              </Box>
            )
          })}
        </Box>
      </Box>

      {/* Content */}
      <Box ref={contentRef} sx={{ overflowY: 'auto', p: { xs: 2, md: 4 } }}>
        {article ? <ArticleView article={article} onOpen={open} /> : <Landing onOpen={open} />}
      </Box>
    </Box>
  )
}

export default DocsModule
