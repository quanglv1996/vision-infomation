import axios from 'axios'

/**
 * Single axios instance for the whole app. `/api` is proxied to the backend
 * by Vite in dev (see vite.config.ts); override with VITE_API_BASE_URL for
 * builds served from a different origin.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

// ── Auth wiring (set up by stores/authStore.ts) ──────────────────────────────

let tokenGetter: () => string | null = () => null
let onSessionExpired: () => void = () => {}

export function configureAuth(getToken: () => string | null, expired: () => void): void {
  tokenGetter = getToken
  onSessionExpired = expired
}

http.interceptors.request.use(config => {
  const token = tokenGetter()
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(undefined, err => {
  // A rejected bearer token (expired, revoked, account locked) ends the session.
  if (axios.isAxiosError(err) && err.response?.status === 401 && errorCode(err) === 'not_authenticated' && tokenGetter()) {
    onSessionExpired()
  }
  return Promise.reject(err)
})

export const getJson = <T>(url: string, params?: Record<string, unknown>): Promise<T> =>
  http.get<T>(url, { params }).then(r => r.data)

export const postJson = <T>(url: string, body?: unknown): Promise<T> =>
  http.post<T>(url, body).then(r => r.data)

export const patchJson = <T>(url: string, body: unknown): Promise<T> =>
  http.patch<T>(url, body).then(r => r.data)

export const deleteJson = (url: string): Promise<void> =>
  http.delete(url).then(() => undefined)

/** POST multipart/form-data (image uploads). */
export const postForm = <T>(url: string, form: FormData): Promise<T> =>
  http.post<T>(url, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)

const detailOf = (err: unknown): unknown => (axios.isAxiosError(err) ? err.response?.data?.detail : undefined)

/** Machine-readable code of an app error (`{"detail": {"code", "message"}}`), if any. */
export const errorCode = (err: unknown): string | undefined => {
  const detail = detailOf(err) as { code?: unknown } | undefined
  return detail && typeof detail === 'object' && typeof detail.code === 'string' ? detail.code : undefined
}

/**
 * User-facing message for a failed request: FastAPI's `detail` when present
 * (string, `{code, message}`, or the 422 validation array), otherwise *fallback*.
 */
export const errorMessage = (err: unknown, fallback: string): string => {
  const detail = detailOf(err)
  if (typeof detail === 'string') return detail
  if (detail && typeof detail === 'object' && 'message' in detail && typeof detail.message === 'string') return detail.message
  if (Array.isArray(detail)) {
    const first = detail[0] as { loc?: unknown[]; msg?: string } | undefined
    if (first?.msg) return `${first.loc?.slice(1).join('.') ?? ''}: ${first.msg}`.replace(/^: /, '')
  }
  if (detail) return JSON.stringify(detail)
  if (axios.isAxiosError(err) && !err.response) return 'Không kết nối được máy chủ.'
  return fallback
}
