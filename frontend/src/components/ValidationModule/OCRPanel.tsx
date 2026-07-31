import React from 'react'
import { Box, Chip, Grid, Stack, Typography } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { ValidationResult } from '@/types/validation'

interface Props { result: ValidationResult }

const OCRPanel: React.FC<Props> = ({ result: { ocr } }) => {
  if (!ocr) return <Box sx={{ p: 3 }}><Typography color="text.secondary">No OCR validation data.</Typography></Box>

  const sc = ocr.char_accuracy_pct >= 99 ? '#10B981' : ocr.char_accuracy_pct >= 97 ? '#3B82F6' : ocr.char_accuracy_pct >= 95 ? '#F59E0B' : '#EF4444'
  const confData = ocr.confidence_hist?.map((v, i) => ({ bin: `${(i * 5).toFixed(0)}%`, count: v })) ?? []

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">OCR Validation ({ocr.n_samples} samples)</Typography>
        <Chip label={ocr.status} size="small" sx={{ bgcolor: sc + '22', color: sc, fontWeight: 700 }} />
      </Stack>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: 'Char Accuracy', value: `${ocr.char_accuracy_pct.toFixed(3)} %`, color: sc },
          { label: 'Word Accuracy', value: `${ocr.word_accuracy_pct.toFixed(3)} %`, color: '#9CA3AF' },
          { label: 'CER',           value: `${ocr.cer_pct.toFixed(3)} %` },
          { label: 'WER',           value: `${ocr.wer_pct.toFixed(3)} %` },
          { label: 'Mean Confidence', value: ocr.mean_confidence_pct != null ? `${ocr.mean_confidence_pct.toFixed(1)} %` : '—' },
        ].map(m => (
          <Grid item xs={6} sm key={m.label}>
            <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">{m.label}</Typography>
              <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700, color: (m as {color?:string}).color ?? 'text.primary' }}>{m.value}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Error rate formula info */}
      <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(0,0,0,0.2)', mb: 2 }}>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#9CA3AF' }}>
          CER = Levenshtein(predicted, reference) / len(reference) × 100%<br />
          WER = Word-level Levenshtein / total_words × 100%
        </Typography>
      </Box>

      {confData.length > 0 && (
        <>
          <Typography variant="body2" color="text.secondary" gutterBottom>Confidence Score Distribution</Typography>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={confData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="bin" tick={{ fontSize: 9, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ background: '#1e2329', border: '1px solid #374151', fontSize: '0.72rem' }} />
              <Bar dataKey="count" fill="#8B5CF6" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </Box>
  )
}

export default OCRPanel
