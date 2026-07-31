import React, { useState } from 'react'
import {
  Accordion, AccordionDetails, AccordionSummary,
  Box, Button, Chip, Grid, Stack, TextField, Typography,
} from '@mui/material'
import { ExpandMore, PlayArrow as RunIcon, Science as SampleIcon } from '@mui/icons-material'
import type { GRRInput, ValidationRequest } from '@/types/validation'

interface Props {
  onRun: (req: ValidationRequest) => void
  isLoading: boolean
}

// ── Parsers ────────────────────────────────────────────────────────────────────
const parseF = (s: string): number[] =>
  s.split(/[,\n\r\t ]+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
const parseI = (s: string): number[] =>
  s.split(/[,\n\r\t ]+/).map(v => parseInt(v.trim())).filter(v => !isNaN(v))
const parseB = (s: string): boolean[] =>
  s.split(/[,\n\r\t ]+/).map(v => {
    const t = v.trim().toLowerCase(); return t === '1' || t === 'true' || t === 'pass'
  })
const parseOCR = (s: string): [string[], string[]] => {
  const lines = s.split('\n').map(l => l.trim()).filter(Boolean)
  return [lines.map(l => l.split('|')[0]?.trim() ?? ''), lines.map(l => l.split('|')[1]?.trim() ?? '')]
}
const parseGRR = (ops: string[]): GRRInput | null => {
  const vals: number[][][] = ops.map(op =>
    op.split('\n').map(line => parseF(line)).filter(r => r.length > 0)
  )
  const nOps = vals.length
  const nParts = Math.min(...vals.map(v => v.length))
  const nReps = Math.min(...vals.flatMap(v => v.map(r => r.length)))
  if (nOps < 2 || nParts < 2 || nReps < 2) return null
  return { values: vals.map(v => v.slice(0, nParts).map(r => r.slice(0, nReps))), n_operators: nOps, n_parts: nParts, n_replicates: nReps }
}

// ── Sample data ────────────────────────────────────────────────────────────────
const SAMPLE = {
  measurements: '10.12,10.08,10.15,10.11,10.09,10.13,10.07,10.14,10.10,10.12,10.09,10.11,10.13,10.08,10.12,10.10,10.11,10.14,10.09,10.12',
  usl: '10.30', lsl: '9.90',
  predictions: '1,0,1,1,0,0,1,0,1,1,0,1,0,1,1,0,0,1,1,0',
  ground_truth: '1,0,1,0,0,0,1,0,1,1,0,1,1,1,1,0,0,1,1,0',
  scores: '0.91,0.12,0.85,0.72,0.18,0.08,0.97,0.22,0.89,0.93,0.05,0.79,0.55,0.82,0.99,0.04,0.11,0.94,0.88,0.15',
  ocr: 'HELLO|HELLO\nWORLD|WORLD\nVISION|VISION\nCAMERA|CAMERA\nINSPECT|NSPECT',
  times: '12.5,13.2,11.8,12.1,14.5,11.9,12.8,13.1,12.3,11.7,12.6,13.4,12.0,11.5,13.8,12.2,12.9,11.6,13.0,12.4',
  stability: '1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1',
  grr_op1: '10.1,10.2\n10.2,10.3\n9.9,9.8\n10.4,10.3\n10.0,10.1',
  grr_op2: '10.0,10.1\n10.3,10.2\n9.8,9.9\n10.3,10.4\n10.1,10.0',
}

const ValidationInput: React.FC<Props> = ({ onRun, isLoading }) => {
  const [meas,    setMeas]    = useState('')
  const [usl,     setUsl]     = useState('')
  const [lsl,     setLsl]     = useState('')
  const [preds,   setPreds]   = useState('')
  const [truth,   setTruth]   = useState('')
  const [scores,  setScores]  = useState('')
  const [classes, setClasses] = useState('')
  const [ocr,     setOcr]     = useState('')
  const [times,   setTimes]   = useState('')
  const [fps,     setFps]     = useState('')
  const [stab,    setStab]    = useState('')
  const [grrOp1,  setGrrOp1]  = useState('')
  const [grrOp2,  setGrrOp2]  = useState('')
  const [sysName, setSysName] = useState('Vision System')

  const loadSample = () => {
    setMeas(SAMPLE.measurements); setUsl(SAMPLE.usl); setLsl(SAMPLE.lsl)
    setPreds(SAMPLE.predictions); setTruth(SAMPLE.ground_truth); setScores(SAMPLE.scores)
    setOcr(SAMPLE.ocr); setTimes(SAMPLE.times); setFps('60')
    setStab(SAMPLE.stability); setGrrOp1(SAMPLE.grr_op1); setGrrOp2(SAMPLE.grr_op2)
  }

  const handleRun = () => {
    const measArr = meas ? parseF(meas) : undefined
    const [ocrPred, ocrTruth] = ocr ? parseOCR(ocr) : [undefined, undefined]
    const grrData = grrOp1 && grrOp2 ? parseGRR([grrOp1, grrOp2]) : undefined
    const cnArr = classes.trim() ? classes.split(',').map(s => s.trim()) : undefined

    const req: ValidationRequest = {
      system_name:        sysName || 'Vision System',
      measurements:       measArr,
      usl:                usl ? parseFloat(usl) : null,
      lsl:                lsl ? parseFloat(lsl) : null,
      predictions:        preds ? parseI(preds) : undefined,
      ground_truth:       truth ? parseI(truth) : undefined,
      scores:             scores ? parseF(scores) : undefined,
      class_names:        cnArr,
      ocr_predicted:      ocrPred,
      ocr_ground_truth:   ocrTruth,
      inference_times_ms: times ? parseF(times) : undefined,
      target_fps:         fps ? parseFloat(fps) : null,
      stability_results:  stab ? parseB(stab) : undefined,
      grr:                grrData,
    }
    onRun(req)
  }

  const hasData = !!(meas || preds || ocr || times || stab || grrOp1)

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <TextField
          label="System Name" size="small" value={sysName}
          onChange={e => setSysName(e.target.value)}
          sx={{ width: 240 }}
        />
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<SampleIcon />} variant="outlined" onClick={loadSample}>
            Load Sample
          </Button>
          <Button
            variant="contained" size="large" startIcon={<RunIcon />}
            disabled={!hasData || isLoading}
            onClick={handleRun}
          >
            {isLoading ? 'Running…' : 'Run Validation'}
          </Button>
        </Stack>
      </Stack>

      {/* Repeatability */}
      <Accordion defaultExpanded sx={{ bgcolor: 'rgba(255,255,255,0.02)', mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">Repeatability / Cp Cpk</Typography>
            {meas && <Chip label={`${parseF(meas).length} pts`} size="small" color="success" />}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={1.5}>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Measurements (comma or newline separated)"
                size="small" value={meas} onChange={e => setMeas(e.target.value)}
                placeholder="10.12, 10.08, 10.15, ..." />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="USL (Upper Spec Limit)" size="small" type="number"
                inputProps={{ step: 'any' }} value={usl} onChange={e => setUsl(e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="LSL (Lower Spec Limit)" size="small" type="number"
                inputProps={{ step: 'any' }} value={lsl} onChange={e => setLsl(e.target.value)} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* AI Performance */}
      <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.02)', mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">AI Performance</Typography>
            {preds && <Chip label={`${parseI(preds).length} samples`} size="small" color="primary" />}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth multiline rows={2} label="Predictions (class indices)" size="small"
                value={preds} onChange={e => setPreds(e.target.value)} placeholder="0, 1, 1, 0, ..." />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth multiline rows={2} label="Ground Truth (class indices)" size="small"
                value={truth} onChange={e => setTruth(e.target.value)} placeholder="0, 1, 0, 1, ..." />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth multiline rows={2} label="Scores / Probabilities (for ROC, optional)" size="small"
                value={scores} onChange={e => setScores(e.target.value)} placeholder="0.9, 0.12, 0.85, ..." />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Class Names (optional)" size="small"
                value={classes} onChange={e => setClasses(e.target.value)} placeholder="NG, OK" />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* OCR */}
      <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.02)', mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">OCR Validation</Typography>
            {ocr && <Chip label={`${ocr.trim().split('\n').length} pairs`} size="small" color="secondary" />}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth multiline rows={4} label="OCR Pairs — one per line: predicted|ground_truth"
            size="small" value={ocr} onChange={e => setOcr(e.target.value)}
            placeholder={'HELLO|HELLO\nWORLD|WORLD\nVISION|VSION'} />
        </AccordionDetails>
      </Accordion>

      {/* Runtime */}
      <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.02)', mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">Runtime Benchmark</Typography>
            {times && <Chip label={`${parseF(times).length} samples`} size="small" sx={{ bgcolor: '#F59E0B22', color: '#F59E0B' }} />}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={9}>
              <TextField fullWidth multiline rows={2} label="Inference times (ms, comma or newline)" size="small"
                value={times} onChange={e => setTimes(e.target.value)} placeholder="12.5, 13.2, 11.8, ..." />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Target FPS" size="small" type="number"
                inputProps={{ step: 'any' }} value={fps} onChange={e => setFps(e.target.value)} placeholder="60" />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Stability */}
      <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.02)', mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">Stability Test</Typography>
            {stab && <Chip label={`${parseB(stab).length} runs`} size="small" sx={{ bgcolor: '#10B98122', color: '#10B981' }} />}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth multiline rows={2}
            label="Pass/Fail results — 1=pass, 0=fail (comma or newline)" size="small"
            value={stab} onChange={e => setStab(e.target.value)} placeholder="1,1,1,0,1,1,..." />
        </AccordionDetails>
      </Accordion>

      {/* GR&R */}
      <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.02)', mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">Gauge R&amp;R</Typography>
            {grrOp1 && grrOp2 && <Chip label="2 operators" size="small" variant="outlined" />}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1 }}>
            One row = one part. Comma-separated values = replicates. Example: 2 operators, 5 parts, 2 replicates.
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth multiline rows={5} label="Operator 1 (one part per line)" size="small"
                value={grrOp1} onChange={e => setGrrOp1(e.target.value)}
                placeholder={'10.1, 10.2\n10.2, 10.3\n9.9, 9.8\n10.4, 10.3\n10.0, 10.1'} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth multiline rows={5} label="Operator 2 (one part per line)" size="small"
                value={grrOp2} onChange={e => setGrrOp2(e.target.value)}
                placeholder={'10.0, 10.1\n10.3, 10.2\n9.8, 9.9\n10.3, 10.4\n10.1, 10.0'} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}

export default ValidationInput
