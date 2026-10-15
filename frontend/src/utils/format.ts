/** Compact numeric display: ~4 significant digits, exponent for extremes. */
export function formatNumber(v: number | null | undefined, digits = 4): string {
  if (v === null || v === undefined || !isFinite(v)) return '—'
  if (v === 0) return '0'
  const a = Math.abs(v)
  if (a < 0.0001 || a >= 1e7) return v.toExponential(2)
  if (a >= 10 ** digits) return Math.round(v).toString()
  const s = v.toPrecision(digits)
  return s.includes('.') && !s.includes('e') ? s.replace(/\.?0+$/, '') : s
}
