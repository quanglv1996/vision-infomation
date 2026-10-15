import React, { useState } from 'react'
import { Avatar, Box, Button, ButtonBase, Divider, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from '@mui/material'
import {
  AdminPanelSettings as AdminIcon,
  Bookmarks as ConfigsIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  ManageAccounts as ProfileIcon,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { useAuthStore } from '@/stores/authStore'
import { useNavStore } from '@/stores/navStore'
import { ACCENT, tint } from '@/theme/theme'
import ProfileDialog from './ProfileDialog'

export const initials = (name: string, email: string): string => {
  const words = (name || email).trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  return (words[0] ?? '?').slice(0, 2).toUpperCase()
}

/** Account entry at the bottom of the navigation rail. */
const AccountMenu: React.FC<{ open: boolean }> = ({ open }) => {
  const { user, ready, openAuth, logout } = useAuthStore()
  const setModule = useNavStore(s => s.setModule)
  const { enqueueSnackbar } = useSnackbar()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  if (!ready) return null

  if (!user) {
    return open ? (
      <Box sx={{ p: 1.25 }}>
        <Button fullWidth variant="contained" startIcon={<LoginIcon />} onClick={() => openAuth('login')}>
          Đăng nhập
        </Button>
        <Typography sx={{ fontSize: '0.66rem', color: 'text.secondary', mt: 0.75, textAlign: 'center', lineHeight: 1.4 }}>
          Đăng ký để lưu & quản lý cấu hình
        </Typography>
      </Box>
    ) : (
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
        <Tooltip title="Đăng nhập" placement="right">
          <ButtonBase onClick={() => openAuth('login')} sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: tint(ACCENT.blue, 0.15), color: ACCENT.blue }}>
            <LoginIcon fontSize="small" />
          </ButtonBase>
        </Tooltip>
      </Box>
    )
  }

  const isAdmin = user.role === 'admin'
  const go = (id: string) => { setAnchor(null); setModule(id) }

  return (
    <>
      <Tooltip title={open ? '' : user.full_name || user.email} placement="right">
        <ButtonBase
          onClick={e => setAnchor(e.currentTarget)}
          sx={{
            width: '100%', justifyContent: open ? 'flex-start' : 'center', gap: 1.25, px: open ? 1.75 : 0, py: 1.1,
            '&:hover': { bgcolor: 'rgba(148,163,184,0.08)' },
          }}
        >
          <Avatar sx={{
            width: 32, height: 32, fontSize: '0.74rem', fontWeight: 700,
            background: isAdmin ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : 'linear-gradient(135deg, #3B82F6, #06B6D4)',
          }}>
            {initials(user.full_name, user.email)}
          </Avatar>
          {open && (
            <Box sx={{ minWidth: 0, textAlign: 'left' }}>
              <Typography noWrap sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.full_name || user.email}</Typography>
              <Typography noWrap sx={{ fontSize: '0.66rem', color: isAdmin ? '#C4B5FD' : 'text.secondary' }}>
                {isAdmin ? 'Quản trị viên' : user.email}
              </Typography>
            </Box>
          )}
        </ButtonBase>
      </Tooltip>

      <Menu
        anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }} transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{ sx: { minWidth: 220 } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{user.full_name}</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>{user.email}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setAnchor(null); setProfileOpen(true) }}>
          <ListItemIcon><ProfileIcon fontSize="small" /></ListItemIcon>Hồ sơ & mật khẩu
        </MenuItem>
        <MenuItem onClick={() => go('configs')}>
          <ListItemIcon><ConfigsIcon fontSize="small" /></ListItemIcon>Cấu hình đã lưu
        </MenuItem>
        {isAdmin && (
          <MenuItem onClick={() => go('admin')}>
            <ListItemIcon><AdminIcon fontSize="small" /></ListItemIcon>Quản lý tài khoản
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => { setAnchor(null); logout(); enqueueSnackbar('Đã đăng xuất.', { variant: 'info' }) }}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>Đăng xuất
        </MenuItem>
      </Menu>

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}

export default AccountMenu
