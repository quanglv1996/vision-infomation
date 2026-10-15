import React, { useEffect, useState } from 'react'
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, Switch,
  TextField, Typography,
} from '@mui/material'
import { TEXT_INPUT_SX } from '@/components/Auth/AuthDialog'
import PasswordField, { passwordProblem } from '@/components/Auth/PasswordField'
import type { AdminUser, AdminUserCreate, AdminUserUpdate, Role } from '@/types/auth'

interface UserDialogProps {
  open: boolean
  /** null → create a new account. */
  user: AdminUser | null
  isSelf: boolean
  busy: boolean
  error: string | null
  onClose: () => void
  onCreate: (body: AdminUserCreate) => void
  onUpdate: (id: number, body: AdminUserUpdate) => void
}

const SwitchRow: React.FC<{ label: string; hint: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }> = ({
  label, hint, checked, disabled, onChange,
}) => (
  <FormControlLabel
    sx={{ alignItems: 'flex-start', m: 0, gap: 1 }}
    control={<Switch size="small" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />}
    label={
      <Stack sx={{ pt: 0.25 }}>
        <Typography sx={{ fontSize: '0.84rem', fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>{hint}</Typography>
      </Stack>
    }
  />
)

/** Create / edit an account (admin). */
const UserDialog: React.FC<UserDialogProps> = ({ open, user, isSelf, busy, error, onClose, onCreate, onUpdate }) => {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('user')
  const [active, setActive] = useState(true)
  const [verified, setVerified] = useState(true)
  const [sendVerification, setSendVerification] = useState(false)

  useEffect(() => {
    if (!open) return
    setEmail(user?.email ?? '')
    setFullName(user?.full_name ?? '')
    setPassword('')
    setRole(user?.role ?? 'user')
    setActive(user?.is_active ?? true)
    setVerified(user?.email_verified ?? true)
    setSendVerification(false)
  }, [open, user])

  const creating = user === null
  const pwProblem = passwordProblem(password)
  const valid = email.trim().length > 3 && fullName.trim().length > 0 && (creating ? password.length >= 8 : !pwProblem)

  const submit = () => {
    if (!valid || busy) return
    if (creating) {
      onCreate({
        email: email.trim(), full_name: fullName.trim(), password, role, is_active: active,
        email_verified: verified, send_verification: !verified && sendVerification,
      })
      return
    }
    const body: AdminUserUpdate = {}
    if (email.trim().toLowerCase() !== user.email) body.email = email.trim()
    if (fullName.trim() !== user.full_name) body.full_name = fullName.trim()
    if (role !== user.role) body.role = role
    if (active !== user.is_active) body.is_active = active
    if (verified !== user.email_verified) body.email_verified = verified
    if (password) body.password = password
    onUpdate(user.id, body)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Stack component="form" onSubmit={e => { e.preventDefault(); submit() }}>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>{creating ? 'Thêm tài khoản' : `Sửa tài khoản — ${user.email}`}</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <TextField label="Họ và tên" value={fullName} onChange={e => setFullName(e.target.value)} fullWidth autoFocus sx={TEXT_INPUT_SX} inputProps={{ maxLength: 100 }} />
              <TextField select label="Vai trò" value={role} onChange={e => setRole(e.target.value as Role)} sx={{ minWidth: 170, ...TEXT_INPUT_SX }} disabled={isSelf}>
                <MenuItem value="user">Người dùng</MenuItem>
                <MenuItem value="admin">Quản trị viên</MenuItem>
              </TextField>
            </Stack>
            <TextField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} fullWidth sx={TEXT_INPUT_SX} />
            <PasswordField
              label={creating ? 'Mật khẩu' : 'Đặt mật khẩu mới'} value={password} onChange={e => setPassword(e.target.value)} fullWidth
              autoComplete="new-password" error={!!pwProblem} disabled={isSelf}
              helperText={pwProblem ?? (creating ? 'Tối thiểu 8 ký tự'
                : isSelf ? 'Đổi mật khẩu của bạn trong menu tài khoản → Hồ sơ & mật khẩu.'
                  : 'Để trống nếu giữ nguyên. Đặt mật khẩu mới sẽ đăng xuất người dùng khỏi mọi thiết bị.')}
            />
            <Stack gap={1.5} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <SwitchRow
                label="Đang hoạt động" hint="Tắt để khóa tài khoản: người dùng bị đăng xuất và không đăng nhập được."
                checked={active} disabled={isSelf} onChange={setActive}
              />
              <SwitchRow
                label="Email đã xác nhận" hint="Bật để duyệt tài khoản mà không cần người dùng bấm liên kết trong email."
                checked={verified} onChange={setVerified}
              />
              {creating && !verified && (
                <SwitchRow
                  label="Gửi email xác nhận" hint="Người dùng nhận email và tự xác nhận địa chỉ."
                  checked={sendVerification} onChange={setSendVerification}
                />
              )}
            </Stack>
            {isSelf && <Alert severity="info" sx={{ py: 0.25 }}>Bạn không thể tự hạ quyền hoặc tự khóa tài khoản của chính mình.</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="submit" variant="contained" disabled={!valid || busy}>{creating ? 'Tạo tài khoản' : 'Lưu thay đổi'}</Button>
        </DialogActions>
      </Stack>
    </Dialog>
  )
}

export default UserDialog
