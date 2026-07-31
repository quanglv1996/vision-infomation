import React, { useRef, useEffect } from 'react'
import { Box, Chip, Grid, Stack, Tab, Tabs, Typography } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import type { ValidationResult } from '@/types/validation'

interface Props { result: ValidationResult }

const CMCanvas: React.FC<{ cm: number[][]; names: string[] }> = ({ cm, names }) => {
  const ref = useRef<HTMLCanvasElement>(null)
  const n = names.length
  const cell = 56
  const pad = 60

  useEffect(() => {
    const c = ref.current; if (!c) return
    const w = pad + n * cell, h = pad + n * cell
    c.width = w; c.height = h
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#0f1117'; ctx.fillRect(0, 0, w, h)

    const total = cm.flat().reduce((a, b) => a + b, 0) || 1
    const rowTotals = cm.map(row => row.reduce((a,b)=>a+b,0))

    for (let r = 0; r < n; r++) {
      for (let c2 = 0; c2 < n; c2++) {
        const v = cm[r][c2]
        const norm = v / Math.max(rowTotals[r], 1)
        const isDiag = r === c2
        const alpha = isDiag ? 0.3 + norm * 0.6 : norm * 0.7
        ctx.fillStyle = isDiag ? `rgba(16,185,129,${alpha})` : `rgba(239,68,68,${alpha})`
        ctx.fillRect(pad + c2 * cell, pad + r * cell, cell - 2, cell - 2)
        ctx.fillStyle = norm > 0.5 ? '#fff' : '#9CA3AF'
        ctx.font = '11px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(String(v), pad + c2 * cell + cell / 2 - 1, pad + r * cell + cell / 2 - 1)
      }
    }
    ctx.fillStyle = '#6B7280'; ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    for (let i = 0; i < n; i++) {
      ctx.fillText(names[i].slice(0, 8), pad + i * cell + cell / 2 - 1, pad - 8)
      ctx.save(); ctx.translate(pad - 8, pad + i * cell + cell / 2 - 1)
      ctx.rotate(-Math.PI / 2); ctx.fillText(names[i].slice(0, 8), 0, 0); ctx.restore()
    }
  }, [cm, names, n, cell, pad])

  return <canvas ref={ref} style={{ display: 'block', borderRadius: 4 }} />
}

const AIPanel: React.FC<Props> = ({ result: { ai } }) => {
  const [tab, setTab] = React.useState(0)
  if (!ai) return <Box sx={{ p: 3 }}><Typography color="text.secondary">No AI performance data.</Typography></Box>

  const f1Color = ai.f1_score >= 0.95 ? '#10B981' : ai.f1_score >= 0.85 ? '#3B82F6' : ai.f1_score >= 0.70 ? '#F59E0B' : '#EF4444'

  const rocData = ai.roc_fpr?.map((fpr, i) => ({ fpr, tpr: ai.roc_tpr?.[i] ?? 0, ref: fpr })) ?? []
  const prData  = ai.pr_recall_pts?.map((rec, i) => ({ recall: rec, precision: ai.pr_precision?.[i] ?? 0 })) ?? []

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">AI Performance ({ai.n_samples} samples)</Typography>
        <Stack direction="row" spacing={0.5}>
          <Chip label={`F1: ${ai.f1_score.toFixed(3)}`} size="small" sx={{ bgcolor: f1Color + '22', color: f1Color, fontWeight: 700 }} />
          {ai.roc_auc && <Chip label={`AUC: ${ai.roc_auc.toFixed(3)}`} size="small" variant="outlined" />}
        </Stack>
      </Stack>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { l: 'Accuracy',  v: (ai.accuracy*100).toFixed(2)+'%' },
          { l: 'Precision', v: (ai.precision*100).toFixed(2)+'%' },
          { l: 'Recall',    v: (ai.recall*100).toFixed(2)+'%' },
          { l: 'F1 Score',  v: ai.f1_score.toFixed(4), color: f1Color },
          { l: 'ROC AUC',   v: ai.roc_auc?.toFixed(4) ?? '—' },
          { l: 'PR AUC',    v: ai.pr_auc?.toFixed(4)  ?? '—' },
        ].map(m => (
          <Grid item xs={4} sm={2} key={m.l}>
            <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">{m.l}</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: (m as {color?:string}).color ?? 'text.primary' }}>{m.v}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1, minHeight: 32, '& .MuiTab-root': { minHeight: 32, fontSize: '0.72rem', py: 0.3 } }}>
        <Tab label="Confusion Matrix" />
        {rocData.length > 0 && <Tab label="ROC Curve" />}
        {prData.length > 0  && <Tab label="PR Curve" />}
        <Tab label="Per-Class" />
      </Tabs>

      {tab === 0 && (
        <Stack spacing={1} alignItems="flex-start">
          <CMCanvas cm={ai.confusion_matrix} names={ai.class_names} />
          <Typography variant="caption" color="text.disabled">Rows = Actual, Cols = Predicted · Green = correct, Red = errors</Typography>
        </Stack>
      )}
      {tab === 1 && rocData.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={rocData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="fpr" tick={{ fontSize: 9, fill: '#9CA3AF' }} label={{ value: 'FPR', position: 'insideBottomRight', fill: '#6B7280', fontSize: 10 }} />
            <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} label={{ value: 'TPR', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#1e2329', border: '1px solid #374151', fontSize: '0.72rem' }} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: '0.72rem' }} />
            <Line type="monotone" dataKey="ref" stroke="rgba(255,255,255,0.2)" dot={false} strokeDasharray="4 2" name="Random" />
            <Line type="monotone" dataKey="tpr" stroke="#3B82F6" dot={false} strokeWidth={2} name={`ROC (AUC=${ai.roc_auc?.toFixed(3)})`} />
          </LineChart>
        </ResponsiveContainer>
      )}
      {tab === (rocData.length > 0 ? 2 : 1) && prData.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={prData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="recall" tick={{ fontSize: 9, fill: '#9CA3AF' }} label={{ value: 'Recall', position: 'insideBottomRight', fill: '#6B7280', fontSize: 10 }} />
            <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} label={{ value: 'Precision', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#1e2329', border: '1px solid #374151', fontSize: '0.72rem' }} />
            <Line type="monotone" dataKey="precision" stroke="#10B981" dot={false} strokeWidth={2} name={`PR (AP=${ai.pr_auc?.toFixed(3)})`} />
          </LineChart>
        </ResponsiveContainer>
      )}
      {tab === ai.class_names.length + 1 - ai.class_names.length + (ai.class_names.length > 0 ? 0 : 0) && (
        <Box>per class</Box>
      )}
    </Box>
  )
}

export default AIPanel
