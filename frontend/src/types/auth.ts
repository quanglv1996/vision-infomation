// Mirrors backend/app/schemas/auth.py

export type Role = 'admin' | 'user'

export interface User {
  id: number
  email: string
  full_name: string
  role: Role
  is_active: boolean
  email_verified: boolean
  created_at: string
  last_login_at: string | null
}

export interface TokenResponse {
  access_token: string
  token_type: 'bearer'
  expires_in: number
  user: User
}

export interface MessageResponse {
  message: string
  email_sent: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
}

export interface ProfileUpdate {
  full_name?: string
  current_password?: string
  new_password?: string
}

// ── Admin ────────────────────────────────────────────────────────────────────

export interface AdminUser extends User {
  config_count: number
  updated_at: string
}

export interface AdminUserCreate {
  email: string
  full_name: string
  password: string
  role: Role
  is_active: boolean
  email_verified: boolean
  send_verification: boolean
}

export interface AdminUserUpdate {
  email?: string
  full_name?: string
  role?: Role
  is_active?: boolean
  email_verified?: boolean
  password?: string
}
