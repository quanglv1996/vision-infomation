import React, { useMemo, useState } from 'react'
import {
  Alert, Avatar, Box, Button, ButtonBase, Chip, CircularProgress, IconButton, InputAdornment, Paper, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material'
import {
  AdminPanelSettings as AdminIcon,
  Block as LockIcon,
  CheckCircleOutline as ApproveIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  ForwardToInbox as ResendIcon,
  Group as UsersIcon,
  HourglassTop as PendingIcon,
  LockOpen as UnlockIcon,
  PersonAdd as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import ModuleHeader from '@/components/common/ModuleHeader'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { TEXT_INPUT_SX } from '@/components/Auth/AuthDialog'
import { initials } from '@/components/Auth/AccountMenu'
import { createUser, deleteUser, fetchUsers, sendUserVerification, updateUser } from '@/services/authApi'
import { errorMessage } from '@/services/http'
import { useAuthStore } from '@/stores/authStore'
import { ACCENT, tint } from '@/theme/theme'
import { TONE } from '@/theme/status'
import type { AdminUser, AdminUserCreate, AdminUserUpdate } from '@/types/auth'
import { foldText, formatDateTime, formatRelative } from '@/utils/format'
import UserDialog from './UserDialog'

type Filter = 'all' | 'pending' | 'active' | 'disabled' | 'admin'

const statusOf = (u: AdminUser): { label: string; color: string } =>
  !u.is_active ? { label: 'Đã khóa', color: TONE.error }
    : !u.email_verified ? { label: 'Chờ xác nhận', color: TONE.warning }
      : { label: 'Hoạt động', color: TONE.success }

const matches = (u: AdminUser, f: Filter) =>
  f === 'all' ? true
    : f === 'pending' ? !u.email_verified
      : f === 'active' ? u.is_active && u.email_verified
        : f === 'disabled' ? !u.is_active
          : u.role === 'admin'

const StatCard: React.FC<{ label: string; value: number; accent: string; Icon: typeof UsersIcon; active: boolean; onClick: () => void }> = ({
  label, value, accent, Icon, active, onClick,
}) => (
  <ButtonBase
    onClick={onClick}
    sx={{
      p: 2, borderRadius: 2.5, justifyContent: 'flex-start', gap: 1.5, textAlign: 'left',
      border: '1px solid', borderColor: active ? tint(accent, 0.6) : 'divider',
      background: `linear-gradient(135deg, ${tint(accent, active ? 0.2 : 0.1)} 0%, ${tint(accent, 0.02)} 100%)`,
      transition: 'all 0.15s', '&:hover': { borderColor: tint(accent, 0.5) },
    }}
  >
    <Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: tint(accent, 0.2), color: accent }}>
      <Icon />
    </Box>
    <Box>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.1 }}>{value}</Typography>
      <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary' }}>{label}</Typography>
    </Box>
  </ButtonBase>
)

/** Admin-only: list, create, edit, approve, lock and delete accounts. */
const AdminModule: React.FC = () => {
  const me = useAuthStore(s => s.user)
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<AdminUser | null | undefined>(undefined)   // undefined = closed, null = new
  const [deleting, setDeleting] = useState<AdminUser | null>(null)

  const isAdmin = me?.role === 'admin'
  const { data: users, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchUsers,
    enabled: isAdmin,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  const notifyError = (err: unknown, fallback: string) => enqueueSnackbar(errorMessage(err, fallback), { variant: 'error' })

  const save = useMutation({
    mutationFn: (args: { id?: number; create?: AdminUserCreate; update?: AdminUserUpdate }) =>
      args.create ? createUser(args.create) : updateUser(args.id!, args.update!),
    onSuccess: (u, args) => {
      invalidate()
      if (u.id === me?.id) useAuthStore.getState().setUser(u)
      setEditing(undefined)
      enqueueSnackbar(args.create ? `Đã tạo tài khoản ${u.email}.` : `Đã cập nhật ${u.email}.`, { variant: 'success' })
    },
  })
  const quick = useMutation({
    mutationFn: ({ id, body }: { id: number; body: AdminUserUpdate; message: string }) => updateUser(id, body),
    onSuccess: (_, { message }) => { invalidate(); enqueueSnackbar(message, { variant: 'success' }) },
    onError: err => notifyError(err, 'Không cập nhật được.'),
  })
  const resend = useMutation({
    mutationFn: (id: number) => sendUserVerification(id),
    onSuccess: r => enqueueSnackbar(r.message, { variant: r.email_sent ? 'success' : 'warning' }),
    onError: err => notifyError(err, 'Không gửi được email.'),
  })
  const remove = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => { invalidate(); setDeleting(null); enqueueSnackbar('Đã xóa tài khoản.', { variant: 'info' }) },
    onError: err => notifyError(err, 'Không xóa được.'),
  })

  const stats = useMemo(() => {
    const list = users ?? []
    return {
      all: list.length,
      pending: list.filter(u => matches(u, 'pending')).length,
      admin: list.filter(u => matches(u, 'admin')).length,
      disabled: list.filter(u => matches(u, 'disabled')).length,
    }
  }, [users])

  const visible = useMemo(() => {
    const q = foldText(query.trim())
    return (users ?? []).filter(u => matches(u, filter) && (!q || foldText(`${u.full_name} ${u.email}`).includes(q)))
  }, [users, filter, query])

  if (!isAdmin) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
        <Alert severity="warning">Chỉ quản trị viên mới truy cập được mục này.</Alert>
      </Stack>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ModuleHeader title="Quản lý tài khoản" subtitle="Duyệt đăng ký, thêm, sửa, khóa và xóa tài khoản người dùng" accent={ACCENT.violet} Icon={AdminIcon}>
        <Tooltip title="Tải lại">
          <span><IconButton size="small" onClick={() => refetch()} disabled={isFetching}><RefreshIcon fontSize="small" /></IconButton></span>
        </Tooltip>
        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => { save.reset(); setEditing(null) }}>Thêm tài khoản</Button>
      </ModuleHeader>

      <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
          <StatCard label="Tổng tài khoản" value={stats.all} accent={ACCENT.blue} Icon={UsersIcon} active={filter === 'all'} onClick={() => setFilter('all')} />
          <StatCard label="Chờ xác nhận email" value={stats.pending} accent={ACCENT.amber} Icon={PendingIcon} active={filter === 'pending'} onClick={() => setFilter('pending')} />
          <StatCard label="Quản trị viên" value={stats.admin} accent={ACCENT.violet} Icon={AdminIcon} active={filter === 'admin'} onClick={() => setFilter('admin')} />
          <StatCard label="Đã khóa" value={stats.disabled} accent={ACCENT.rose} Icon={LockIcon} active={filter === 'disabled'} onClick={() => setFilter('disabled')} />
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} alignItems={{ md: 'center' }} sx={{ mb: 2 }}>
          <TextField
            placeholder="Tìm theo tên hoặc email…" value={query} onChange={e => setQuery(e.target.value)}
            sx={{ ...TEXT_INPUT_SX, width: { md: 320 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
          />
          <Box sx={{ flex: 1 }} />
          <ToggleButtonGroup exclusive size="small" value={filter} onChange={(_, v: Filter | null) => v && setFilter(v)} sx={{ flexWrap: 'wrap' }}>
            <ToggleButton value="all" sx={{ px: 1.5 }}>Tất cả</ToggleButton>
            <ToggleButton value="pending" sx={{ px: 1.5 }}>Chờ xác nhận</ToggleButton>
            <ToggleButton value="active" sx={{ px: 1.5 }}>Hoạt động</ToggleButton>
            <ToggleButton value="disabled" sx={{ px: 1.5 }}>Đã khóa</ToggleButton>
            <ToggleButton value="admin" sx={{ px: 1.5 }}>Admin</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage(error, 'Không tải được danh sách tài khoản.')}</Alert>}

        <TableContainer component={Paper} sx={{ borderRadius: 2.5 }}>
          <Table size="small" sx={{ '& td, & th': { borderColor: 'divider' }, minWidth: 860 }}>
            <TableHead>
              <TableRow sx={{ '& th': { fontSize: '0.7rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#64748B', py: 1.25 } }}>
                <TableCell>Người dùng</TableCell>
                <TableCell>Vai trò</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Cấu hình</TableCell>
                <TableCell>Đăng ký</TableCell>
                <TableCell>Đăng nhập gần nhất</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress size={28} /></TableCell></TableRow>
              )}
              {!isLoading && visible.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>Không có tài khoản phù hợp.</TableCell></TableRow>
              )}
              {visible.map(u => {
                const st = statusOf(u)
                const self = u.id === me?.id
                const busy = quick.isPending && quick.variables?.id === u.id
                return (
                  <TableRow key={u.id} hover sx={{ '& td': { py: 1.1 } }}>
                    <TableCell>
                      <Stack direction="row" gap={1.25} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.72rem', fontWeight: 700, bgcolor: tint(u.role === 'admin' ? ACCENT.violet : ACCENT.blue, 0.3), color: '#fff' }}>
                          {initials(u.full_name, u.email)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: '0.84rem', fontWeight: 600 }}>
                            {u.full_name || '—'}{self && <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}> (bạn)</Box>}
                          </Typography>
                          <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary' }}>{u.email}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={u.role === 'admin' ? 'Quản trị' : 'Người dùng'}
                        sx={{ bgcolor: tint(u.role === 'admin' ? ACCENT.violet : '#64748B', 0.18), color: u.role === 'admin' ? '#C4B5FD' : '#CBD5E1' }} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={st.label} sx={{ bgcolor: tint(st.color, 0.15), color: st.color, fontWeight: 600 }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem' }}>{u.config_count}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      <Tooltip title={formatDateTime(u.created_at)}><span>{formatRelative(u.created_at)}</span></Tooltip>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', color: u.last_login_at ? 'text.primary' : 'text.secondary', whiteSpace: 'nowrap' }}>
                      {u.last_login_at ? <Tooltip title={formatDateTime(u.last_login_at)}><span>{formatRelative(u.last_login_at)}</span></Tooltip> : 'Chưa đăng nhập'}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {!u.email_verified && (
                        <>
                          <Tooltip title="Duyệt (đánh dấu email đã xác nhận)">
                            <IconButton size="small" disabled={busy} sx={{ color: TONE.success }}
                              onClick={() => quick.mutate({ id: u.id, body: { email_verified: true }, message: `Đã duyệt ${u.email}.` })}>
                              <ApproveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Gửi lại email xác nhận">
                            <IconButton size="small" disabled={resend.isPending} onClick={() => resend.mutate(u.id)}>
                              <ResendIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Sửa">
                        <IconButton size="small" onClick={() => { save.reset(); setEditing(u) }}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title={self ? 'Không thể tự khóa' : u.is_active ? 'Khóa tài khoản' : 'Mở khóa'}>
                        <span>
                          <IconButton size="small" disabled={self || busy} sx={{ color: u.is_active ? TONE.warning : TONE.success }}
                            onClick={() => quick.mutate({
                              id: u.id, body: { is_active: !u.is_active },
                              message: u.is_active ? `Đã khóa ${u.email}.` : `Đã mở khóa ${u.email}.`,
                            })}>
                            {u.is_active ? <LockIcon fontSize="small" /> : <UnlockIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={self ? 'Không thể tự xóa' : 'Xóa'}>
                        <span>
                          <IconButton size="small" disabled={self} sx={{ color: '#F87171' }} onClick={() => setDeleting(u)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <UserDialog
        open={editing !== undefined}
        user={editing ?? null}
        isSelf={!!editing && editing.id === me?.id}
        busy={save.isPending}
        error={save.error ? errorMessage(save.error, 'Không lưu được.') : null}
        onClose={() => setEditing(undefined)}
        onCreate={body => save.mutate({ create: body })}
        onUpdate={(id, body) => save.mutate({ id, update: body })}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Xóa tài khoản?"
        message={<>Tài khoản <b>{deleting?.email}</b>{deleting?.config_count ? <> và <b>{deleting.config_count}</b> cấu hình đã lưu</> : null} sẽ bị xóa vĩnh viễn.</>}
        confirmLabel="Xóa tài khoản"
        danger
        busy={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </Box>
  )
}

export default AdminModule
