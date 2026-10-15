import { deleteJson, getJson, patchJson, postJson } from './http'
import type {
  AdminUser,
  AdminUserCreate,
  AdminUserUpdate,
  MessageResponse,
  ProfileUpdate,
  RegisterRequest,
  TokenResponse,
  User,
} from '@/types/auth'

// ── Account ──────────────────────────────────────────────────────────────────

export const register = (body: RegisterRequest) => postJson<MessageResponse>('/auth/register', body)
export const login = (email: string, password: string) => postJson<TokenResponse>('/auth/login', { email, password })
export const verifyEmail = (token: string) => postJson<TokenResponse>('/auth/verify-email', { token })
export const resendVerification = (email: string) => postJson<MessageResponse>('/auth/resend-verification', { email })
export const forgotPassword = (email: string) => postJson<MessageResponse>('/auth/forgot-password', { email })
export const resetPassword = (token: string, new_password: string) =>
  postJson<TokenResponse>('/auth/reset-password', { token, new_password })
export const fetchMe = () => getJson<User>('/auth/me')
export const updateMe = (body: ProfileUpdate) => patchJson<TokenResponse>('/auth/me', body)

// ── Admin ────────────────────────────────────────────────────────────────────

export const fetchUsers = () => getJson<AdminUser[]>('/admin/users')
export const createUser = (body: AdminUserCreate) => postJson<AdminUser>('/admin/users', body)
export const updateUser = (id: number, body: AdminUserUpdate) => patchJson<AdminUser>(`/admin/users/${id}`, body)
export const deleteUser = (id: number) => deleteJson(`/admin/users/${id}`)
export const sendUserVerification = (id: number) => postJson<MessageResponse>(`/admin/users/${id}/send-verification`)
