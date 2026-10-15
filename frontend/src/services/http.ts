import axios from 'axios'

/**
 * Single axios instance for the whole app. `/api` is proxied to the backend
 * by Vite in dev (see vite.config.ts); override with VITE_API_BASE_URL for
 * builds served from a different origin.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

export const getJson = <T>(url: string): Promise<T> =>
  http.get<T>(url).then(r => r.data)

export const postJson = <T>(url: string, body: unknown): Promise<T> =>
  http.post<T>(url, body).then(r => r.data)

/** POST multipart/form-data (image uploads). */
export const postForm = <T>(url: string, form: FormData): Promise<T> =>
  http.post<T>(url, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)

/**
 * User-facing message for a failed request: FastAPI's `detail` when present
 * (string, or JSON for 422 validation arrays), otherwise *fallback*.
 */
export const errorMessage = (err: unknown, fallback: string): string => {
  const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined
  if (typeof detail === 'string') return detail
  if (detail) return JSON.stringify(detail)
  return fallback
}
