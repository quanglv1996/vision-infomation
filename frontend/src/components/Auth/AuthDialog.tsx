import React, { useEffect, useState } from 'react'
import {
  Alert, Box, Button, CircularProgress, Dialog, IconButton, Link, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material'
import { Close as CloseIcon, MarkEmailRead as MailIcon } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { forgotPassword, login, register, resendVerification } from '@/services/authApi'
import { errorCode, errorMessage } from '@/services/http'
import { useAuthStore, type AuthView } from '@/stores/authStore'
import { tint } from '@/theme/theme'
import PasswordField, { passwordProblem } from './PasswordField'

/** Text inputs here are prose, not numbers: undo the theme's monospace input font. */
export const TEXT_INPUT_SX = { '& .MuiOutlinedInput-root': { fontFamily: 'inherit' } } as const

export const Brand: React.FC<{ subtitle?: string }> = ({ subtitle }) => (
  <Stack direction="row" alignItems="center" gap={1.25}>
    <Box
      sx={{
        width: 38, height: 38, borderRadius: 2, flexShrink: 0,
        background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 55%, #EC4899 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.78rem', fontWeight: 800, color: '#fff', boxShadow: '0 6px 18px rgba(99,102,241,0.45)',
      }}
    >
      MV
    </Box>
    <Box>
      <Typography sx={{ fontWeight: 800, fontSize: '1.02rem', lineHeight: 1.2 }}>Vision Studio</Typography>
      {subtitle && <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>{subtitle}</Typography>}
    </Box>
  </Stack>
)

/** "Check your inbox" panel shown after registration / reset requests. */
const SentPanel: React.FC<{ email: string; message: string; onResend?: () => Promise<void>; onBack: () => void }> = ({ email, message, onResend, onBack }) => {
  const [busy, setBusy] = useState(false)
  return (
    <Stack alignItems="center" textAlign="center" gap={1.5} sx={{ py: 2 }}>
      <Box sx={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: tint('#10B981', 0.15), color: '#10B981' }}>
        <MailIcon sx={{ fontSize: 32 }} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: '1.05rem' }}>Kiểm tra hộp thư</Typography>
      <Typography sx={{ fontSize: '0.84rem', color: '#CBD5E1', lineHeight: 1.6 }}>{message}</Typography>
      <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>
        Không thấy email? Xem thư mục Spam/Quảng cáo của <b>{email}</b>.
      </Typography>
      <Stack direction="row" gap={1} sx={{ mt: 1 }}>
        {onResend && (
          <Button
            variant="outlined" size="small" disabled={busy}
            onClick={async () => { setBusy(true); try { await onResend() } finally { setBusy(false) } }}
          >
            Gửi lại email
          </Button>
        )}
        <Button size="small" onClick={onBack}>Quay lại đăng nhập</Button>
      </Stack>
    </Stack>
  )
}

/** Sign in / register / forgot-password dialog, driven by authStore.dialog. */
const AuthDialog: React.FC = () => {
  const { dialog, dialogReason, openAuth, closeAuth, setSession } = useAuthStore()
  const { enqueueSnackbar } = useSnackbar()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState<string | undefined>()
  const [sent, setSent] = useState<{ message: string; kind: 'verify' | 'reset' } | null>(null)

  // Fresh state on every open / view switch (keep the typed email).
  useEffect(() => { setError(null); setCode(undefined); setSent(null); setPassword(''); setConfirm('') }, [dialog])

  if (!dialog) return null
  const view: AuthView = dialog

  const fail = (err: unknown, fallback: string) => { setError(errorMessage(err, fallback)); setCode(errorCode(err)) }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null); setCode(undefined)
    try { await fn() } finally { setBusy(false) }
  }

  const doLogin = () => run(async () => {
    try {
      const t = await login(email.trim(), password)
      setSession(t)
      closeAuth()
      enqueueSnackbar(`Xin chào, ${t.user.full_name || t.user.email}!`, { variant: 'success' })
    } catch (err) { fail(err, 'Đăng nhập thất bại.') }
  })

  const doRegister = () => run(async () => {
    try {
      const r = await register({ email: email.trim(), password, full_name: fullName.trim() })
      setSent({ message: r.message, kind: 'verify' })
    } catch (err) { fail(err, 'Đăng ký thất bại.') }
  })

  const doForgot = () => run(async () => {
    try {
      const r = await forgotPassword(email.trim())
      setSent({ message: r.message, kind: 'reset' })
    } catch (err) { fail(err, 'Không gửi được yêu cầu.') }
  })

  const resend = async () => {
    try {
      const r = await resendVerification(email.trim())
      enqueueSnackbar(r.message, { variant: r.email_sent ? 'success' : 'error' })
      if (!sent) setSent({ message: r.message, kind: 'verify' })
    } catch (err) { enqueueSnackbar(errorMessage(err, 'Không gửi được email.'), { variant: 'error' }) }
  }

  const pwProblem = view === 'register' ? passwordProblem(password) : null
  const mismatch = view === 'register' && confirm.length > 0 && confirm !== password
  const canSubmit = !busy && email.trim().length > 3 && (
    view === 'login' ? password.length > 0
      : view === 'register' ? fullName.trim().length > 0 && password.length >= 8 && confirm === password
        : true
  )
  const submit = view === 'login' ? doLogin : view === 'register' ? doRegister : doForgot

  return (
    <Dialog
      open onClose={closeAuth} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', background: 'linear-gradient(180deg, #171C28 0%, #121620 100%)' } }}
    >
      <Box sx={{ height: 4, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899)' }} />
      <Box sx={{ p: 3, pt: 2.5 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
          <Brand subtitle={view === 'forgot' ? 'Khôi phục mật khẩu' : 'Tài khoản lưu cấu hình hệ vision'} />
          <IconButton size="small" onClick={closeAuth} aria-label="Đóng"><CloseIcon fontSize="small" /></IconButton>
        </Stack>

        {sent ? (
          <SentPanel
            email={email.trim()}
            message={sent.message}
            onResend={sent.kind === 'verify' ? resend : undefined}
            onBack={() => openAuth('login')}
          />
        ) : (
          <Box component="form" onSubmit={e => { e.preventDefault(); if (canSubmit) submit() }}>
            {view !== 'forgot' && (
              <Tabs
                value={view} onChange={(_, v: AuthView) => openAuth(v, dialogReason ?? undefined)} variant="fullWidth"
                sx={{ mb: 2, minHeight: 38, borderBottom: '1px solid', borderColor: 'divider', '& .MuiTab-root': { minHeight: 38 } }}
              >
                <Tab value="login" label="Đăng nhập" />
                <Tab value="register" label="Đăng ký" />
              </Tabs>
            )}

            {dialogReason && view !== 'forgot' && <Alert severity="info" sx={{ mb: 2, py: 0.25 }}>{dialogReason}</Alert>}
            {view === 'forgot' && (
              <Typography sx={{ fontSize: '0.82rem', color: '#CBD5E1', mb: 2, lineHeight: 1.6 }}>
                Nhập email đã đăng ký — chúng tôi sẽ gửi liên kết để đặt mật khẩu mới.
              </Typography>
            )}

            <Stack gap={1.75}>
              {view === 'register' && (
                <TextField
                  label="Họ và tên" value={fullName} onChange={e => setFullName(e.target.value)}
                  autoComplete="name" fullWidth sx={TEXT_INPUT_SX} inputProps={{ maxLength: 100 }}
                />
              )}
              <TextField
                label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email" autoFocus fullWidth sx={TEXT_INPUT_SX}
              />
              {view !== 'forgot' && (
                <PasswordField
                  label="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete={view === 'login' ? 'current-password' : 'new-password'} fullWidth
                  error={!!pwProblem} helperText={pwProblem ?? (view === 'register' ? 'Tối thiểu 8 ký tự' : undefined)}
                />
              )}
              {view === 'register' && (
                <PasswordField
                  label="Nhập lại mật khẩu" value={confirm} onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password" fullWidth error={mismatch} helperText={mismatch ? 'Mật khẩu không khớp' : undefined}
                />
              )}
            </Stack>

            {view === 'login' && (
              <Box sx={{ textAlign: 'right', mt: 0.75 }}>
                <Link component="button" type="button" underline="hover" sx={{ fontSize: '0.76rem' }} onClick={() => openAuth('forgot')}>
                  Quên mật khẩu?
                </Link>
              </Box>
            )}

            {error && (
              <Alert
                severity={code === 'email_not_verified' || code === 'email_pending' ? 'warning' : 'error'}
                sx={{ mt: 2 }}
                action={code === 'email_not_verified' || code === 'email_pending'
                  ? <Button color="inherit" size="small" onClick={resend}>Gửi lại</Button>
                  : undefined}
              >
                {error}
              </Alert>
            )}

            <Button
              type="submit" variant="contained" fullWidth size="large" disabled={!canSubmit}
              sx={{ mt: 2.5 }}
              startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {view === 'login' ? 'Đăng nhập' : view === 'register' ? 'Tạo tài khoản' : 'Gửi liên kết đặt lại'}
            </Button>

            {view === 'register' && (
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 1.5, textAlign: 'center' }}>
                Sau khi đăng ký, bạn cần xác nhận qua email trước khi đăng nhập.
              </Typography>
            )}
            {view === 'forgot' && (
              <Box sx={{ textAlign: 'center', mt: 1.5 }}>
                <Link component="button" type="button" underline="hover" sx={{ fontSize: '0.78rem' }} onClick={() => openAuth('login')}>
                  ← Quay lại đăng nhập
                </Link>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Dialog>
  )
}

export default AuthDialog
