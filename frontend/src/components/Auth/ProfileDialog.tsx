import React, { useEffect, useState } from 'react'
import {
  Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, TextField, Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { updateMe } from '@/services/authApi'
import { errorMessage } from '@/services/http'
import { useAuthStore } from '@/stores/authStore'
import { formatDateTime } from '@/utils/format'
import { TEXT_INPUT_SX } from './AuthDialog'
import PasswordField, { passwordProblem } from './PasswordField'

/** Own account: display name and password change. */
const ProfileDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user, setSession } = useAuthStore()
  const { enqueueSnackbar } = useSnackbar()
  const [name, setName] = useState('')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && user) { setName(user.full_name); setCurrent(''); setNext(''); setError(null) }
  }, [open, user])

  if (!user) return null

  const nameChanged = name.trim() !== user.full_name && name.trim().length > 0
  const pwChange = next.length > 0
  const canSave = !busy && (nameChanged || (pwChange && next.length >= 8 && current.length > 0))

  const save = async () => {
    setBusy(true); setError(null)
    try {
      const t = await updateMe({
        ...(nameChanged ? { full_name: name.trim() } : {}),
        ...(pwChange ? { current_password: current, new_password: next } : {}),
      })
      setSession(t)
      enqueueSnackbar(pwChange ? 'Đã đổi mật khẩu.' : 'Đã cập nhật hồ sơ.', { variant: 'success' })
      onClose()
    } catch (err) {
      setError(errorMessage(err, 'Không cập nhật được.'))
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>Hồ sơ tài khoản</DialogTitle>
      <DialogContent>
        <Stack gap={0.5} sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: '0.84rem' }}>{user.email}</Typography>
          <Stack direction="row" gap={1} alignItems="center">
            <Chip size="small" label={user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'} color={user.role === 'admin' ? 'secondary' : 'default'} />
            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>Tạo lúc {formatDateTime(user.created_at)}</Typography>
          </Stack>
        </Stack>
        <TextField label="Họ và tên" value={name} onChange={e => setName(e.target.value)} fullWidth sx={TEXT_INPUT_SX} inputProps={{ maxLength: 100 }} />
        <Divider sx={{ my: 2.5 }}><Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>Đổi mật khẩu</Typography></Divider>
        <Stack gap={1.75}>
          <PasswordField label="Mật khẩu hiện tại" value={current} onChange={e => setCurrent(e.target.value)} fullWidth autoComplete="current-password" />
          <PasswordField
            label="Mật khẩu mới" value={next} onChange={e => setNext(e.target.value)} fullWidth autoComplete="new-password"
            error={!!passwordProblem(next)} helperText={passwordProblem(next) ?? 'Để trống nếu không đổi'}
          />
        </Stack>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Đóng</Button>
        <Button variant="contained" disabled={!canSave} onClick={save}>Lưu thay đổi</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ProfileDialog
