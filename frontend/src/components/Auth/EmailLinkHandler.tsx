import React, { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Dialog, Stack, Typography } from '@mui/material'
import { CheckCircleRounded as OkIcon, ErrorRounded as FailIcon } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { resetPassword, verifyEmail } from '@/services/authApi'
import { errorMessage } from '@/services/http'
import { useAuthStore } from '@/stores/authStore'
import { Brand } from './AuthDialog'
import PasswordField, { passwordProblem } from './PasswordField'

type LinkAction = { kind: 'verify' | 'reset'; token: string }

/** Read ?verify= / ?reset= once and strip it from the address bar. */
function takeLinkAction(): LinkAction | null {
  const url = new URL(window.location.href)
  const verify = url.searchParams.get('verify')
  const reset = url.searchParams.get('reset')
  if (!verify && !reset) return null
  url.searchParams.delete('verify')
  url.searchParams.delete('reset')
  window.history.replaceState(null, '', url.pathname + url.search + url.hash)
  return verify ? { kind: 'verify', token: verify } : { kind: 'reset', token: reset! }
}

// Once per page load (not in a state initializer: StrictMode would call it twice).
const LINK_ACTION = takeLinkAction()

/** Handles the links sent by email: confirm address, set a new password. */
const EmailLinkHandler: React.FC = () => {
  const action = LINK_ACTION
  const [open, setOpen] = useState(action !== null)
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>(action?.kind === 'verify' ? 'busy' : 'idle')
  const [message, setMessage] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const { setSession, openAuth } = useAuthStore()
  const { enqueueSnackbar } = useSnackbar()
  const started = useRef(false)

  useEffect(() => {
    if (action?.kind !== 'verify' || started.current) return
    started.current = true
    verifyEmail(action.token)
      .then(t => {
        setSession(t)
        setState('done')
        setMessage(`Email ${t.user.email} đã được xác nhận. Bạn đã đăng nhập và có thể lưu cấu hình.`)
      })
      .catch(err => { setState('error'); setMessage(errorMessage(err, 'Không xác nhận được email.')) })
  }, [action, setSession])

  if (!action) return null

  const submitReset = async () => {
    setState('busy')
    try {
      const t = await resetPassword(action.token, password)
      setSession(t)
      setOpen(false)
      enqueueSnackbar('Đã đặt mật khẩu mới và đăng nhập.', { variant: 'success' })
    } catch (err) {
      setState('error')
      setMessage(errorMessage(err, 'Không đặt lại được mật khẩu.'))
    }
  }

  const pwProblem = passwordProblem(password)
  const mismatch = confirm.length > 0 && confirm !== password

  return (
    <Dialog open={open} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      <Box sx={{ height: 4, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899)' }} />
      <Box sx={{ p: 3 }}>
        <Brand subtitle={action.kind === 'verify' ? 'Xác nhận email' : 'Đặt mật khẩu mới'} />

        {action.kind === 'verify' ? (
          <Stack alignItems="center" textAlign="center" gap={1.5} sx={{ mt: 3 }}>
            {state === 'busy' && <><CircularProgress /><Typography sx={{ fontSize: '0.84rem' }}>Đang xác nhận email…</Typography></>}
            {state === 'done' && <><OkIcon sx={{ fontSize: 54, color: '#10B981' }} /><Typography sx={{ fontSize: '0.86rem', lineHeight: 1.6 }}>{message}</Typography></>}
            {state === 'error' && <><FailIcon sx={{ fontSize: 54, color: '#EF4444' }} /><Typography sx={{ fontSize: '0.86rem', lineHeight: 1.6 }}>{message}</Typography></>}
            <Stack direction="row" gap={1} sx={{ mt: 1 }}>
              {state === 'error' && (
                <Button variant="outlined" onClick={() => { setOpen(false); openAuth('login') }}>Đăng nhập / gửi lại</Button>
              )}
              <Button variant="contained" disabled={state === 'busy'} onClick={() => setOpen(false)}>
                {state === 'done' ? 'Bắt đầu sử dụng' : 'Đóng'}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Box component="form" sx={{ mt: 2.5 }} onSubmit={e => { e.preventDefault(); submitReset() }}>
            <Stack gap={1.75}>
              <PasswordField
                label="Mật khẩu mới" value={password} onChange={e => setPassword(e.target.value)} autoFocus fullWidth
                autoComplete="new-password" error={!!pwProblem} helperText={pwProblem ?? 'Tối thiểu 8 ký tự'}
              />
              <PasswordField
                label="Nhập lại mật khẩu" value={confirm} onChange={e => setConfirm(e.target.value)} fullWidth
                autoComplete="new-password" error={mismatch} helperText={mismatch ? 'Mật khẩu không khớp' : undefined}
              />
            </Stack>
            {state === 'error' && <Alert severity="error" sx={{ mt: 2 }}>{message}</Alert>}
            <Stack direction="row" gap={1} justifyContent="flex-end" sx={{ mt: 2.5 }}>
              <Button onClick={() => setOpen(false)}>Hủy</Button>
              <Button
                type="submit" variant="contained"
                disabled={state === 'busy' || password.length < 8 || confirm !== password}
              >
                Đặt mật khẩu
              </Button>
            </Stack>
          </Box>
        )}
      </Box>
    </Dialog>
  )
}

export default EmailLinkHandler
