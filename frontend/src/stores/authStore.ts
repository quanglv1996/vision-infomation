import { create } from 'zustand'
import { enqueueSnackbar } from 'notistack'
import type { TokenResponse, User } from '@/types/auth'
import { fetchMe } from '@/services/authApi'
import { configureAuth } from '@/services/http'
import { useConfigStore } from './configStore'

export type AuthView = 'login' | 'register' | 'forgot'

const TOKEN_KEY = 'vision-studio.token'

const readToken = (): string | null => {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
const writeToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch { /* storage unavailable: session lasts until reload */ }
}

interface AuthStore {
  token: string | null
  user: User | null
  /** False until the stored token has been checked against /auth/me. */
  ready: boolean
  /** Which auth dialog is open (null = closed), plus an optional reason line. */
  dialog: AuthView | null
  dialogReason: string | null

  init: () => Promise<void>
  setSession: (t: TokenResponse) => void
  setUser: (u: User) => void
  logout: () => void
  openAuth: (view?: AuthView, reason?: string) => void
  closeAuth: () => void
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  token: readToken(),
  user: null,
  ready: false,
  dialog: null,
  dialogReason: null,

  async init() {
    if (!get().token) { set({ ready: true }); return }
    try {
      set({ user: await fetchMe(), ready: true })
    } catch {
      // Invalid / expired token, or backend down: continue as a guest.
      writeToken(null)
      set({ token: null, user: null, ready: true })
    }
  },

  setSession(t) {
    writeToken(t.access_token)
    set({ token: t.access_token, user: t.user, ready: true })
  },

  setUser(u) { set({ user: u }) },

  logout() {
    writeToken(null)
    useConfigStore.getState().clear()
    set({ token: null, user: null })
  },

  openAuth(view = 'login', reason) { set({ dialog: view, dialogReason: reason ?? null }) },
  closeAuth() { set({ dialog: null, dialogReason: null }) },
}))

configureAuth(
  () => useAuthStore.getState().token,
  () => {
    useAuthStore.getState().logout()
    enqueueSnackbar('Phiên đăng nhập đã hết hạn — hãy đăng nhập lại.', { variant: 'warning' })
  },
)

/** Signed-in user, or null for guests. */
export const useCurrentUser = () => useAuthStore(s => s.user)
