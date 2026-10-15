/**
 * Semantic colours for pass/warn/fail-style status badges.
 *
 * Each module maps its own backend status strings (e.g. 'capable', 'blurry')
 * onto these tones, so the hex values live in one place.
 */
export const TONE = {
  success: '#10B981',
  info:    '#3B82F6',
  warning: '#F59E0B',
  error:   '#EF4444',
  neutral: '#9CA3AF',
  muted:   '#6B7280',
} as const

export type StatusColorMap = Record<string, string>

/** pass / warning / fail */
export const PASS_FAIL_COLORS: StatusColorMap = {
  pass: TONE.success, warning: TONE.warning, fail: TONE.error,
}

/** excellent / good / acceptable / poor (calibration & uniformity grades) */
export const GRADE_COLORS: StatusColorMap = {
  excellent: TONE.success, good: TONE.info, acceptable: TONE.warning, poor: TONE.error, bad: TONE.error,
}

/** Look up a status colour with a fallback for unknown / missing statuses. */
export const statusColor = (map: StatusColorMap, status: string | null | undefined, fallback: string = TONE.neutral): string =>
  (status != null && map[status]) || fallback
