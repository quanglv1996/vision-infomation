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

/** Lower-case, accent-free text for Vietnamese-friendly search ("Độ sâu" → "do sau"). */
export const foldText = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

/** "16/10/2026 14:05" */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** "vừa xong", "5 phút trước", "3 ngày trước", then the date. */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (isNaN(t)) return '—'
  const s = Math.round((Date.now() - t) / 1000)
  if (s < 60) return 'vừa xong'
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} ngày trước`
  return formatDateTime(iso).split(' ')[0]
}
