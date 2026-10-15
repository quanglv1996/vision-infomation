import React, { useState } from 'react'
import { Box, Button, Chip, IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material'
import {
  MoreVert as MoreIcon,
  BookmarkAdded as LinkedIcon,
  LinkOff as UnlinkIcon,
  NoteAdd as SaveAsIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import { useQueryClient } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import { createConfig, updateConfig } from '@/services/configApi'
import { errorMessage } from '@/services/http'
import { useAuthStore } from '@/stores/authStore'
import { configKey, isDirty, useConfigStore } from '@/stores/configStore'
import { tint } from '@/theme/theme'
import ConfigFormDialog from './ConfigFormDialog'

interface SaveConfigButtonProps {
  /** Guided scenario id, or null for the free-form calculator. */
  scenarioId: string | null
  mode: string | null
  values: Record<string, number>
  targets?: string[]
  /** Suggested name for a new config. */
  suggestedName: string
}

/**
 * "Lưu" for a calculator workspace. Saving once links the workspace to the
 * new config; later saves update it in place ("Lưu thành bản mới" forks).
 */
const SaveConfigButton: React.FC<SaveConfigButtonProps> = ({ scenarioId, mode, values, targets = [], suggestedName }) => {
  const user = useAuthStore(s => s.user)
  const openAuth = useAuthStore(s => s.openAuth)
  const key = configKey(scenarioId)
  const linked = useConfigStore(s => s.linked[key])
  const { link, unlink } = useConfigStore()
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()

  const [dialog, setDialog] = useState(false)
  const [menu, setMenu] = useState<HTMLElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const empty = Object.keys(values).length === 0
  const dirty = linked ? isDirty(linked, mode, values, targets) : false

  const requireLogin = () => openAuth('login', 'Đăng nhập (hoặc đăng ký miễn phí) để lưu và quản lý cấu hình.')

  const saveNew = async (name: string, description: string) => {
    setBusy(true); setError(null)
    try {
      const cfg = await createConfig({ name, description, scenario_id: scenarioId, mode, values, targets })
      link(cfg)
      queryClient.invalidateQueries({ queryKey: ['configs'] })
      setDialog(false)
      enqueueSnackbar(`Đã lưu cấu hình "${cfg.name}".`, { variant: 'success' })
    } catch (err) {
      setError(errorMessage(err, 'Không lưu được cấu hình.'))
    } finally { setBusy(false) }
  }

  const saveLinked = async () => {
    if (!linked) return
    setBusy(true)
    try {
      const cfg = await updateConfig(linked.id, { scenario_id: scenarioId, mode, values, targets })
      link(cfg)
      queryClient.invalidateQueries({ queryKey: ['configs'] })
      enqueueSnackbar(`Đã cập nhật "${cfg.name}".`, { variant: 'success' })
    } catch (err) {
      enqueueSnackbar(errorMessage(err, 'Không lưu được cấu hình.'), { variant: 'error' })
      // Deleted from another tab / by an admin: fall back to "save as new".
      if ((err as { response?: { status?: number } })?.response?.status === 404) unlink(key)
    } finally { setBusy(false) }
  }

  const primary = () => {
    if (!user) return requireLogin()
    if (linked) return saveLinked()
    setError(null); setDialog(true)
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {user && linked && (
        <Tooltip title={dirty ? 'Có thay đổi chưa lưu' : 'Đang làm việc trên cấu hình đã lưu'}>
          <Chip
            icon={<LinkedIcon sx={{ fontSize: '16px !important' }} />}
            label={<>{linked.name}{dirty && <Box component="span" sx={{ color: '#F59E0B', ml: 0.75 }}>● chưa lưu</Box>}</>}
            size="small"
            onDelete={() => unlink(key)}
            deleteIcon={<Tooltip title="Bỏ liên kết — lần lưu sau tạo cấu hình mới"><UnlinkIcon /></Tooltip>}
            sx={{ maxWidth: 280, bgcolor: tint('#10B981', 0.12), color: '#A7F3D0', '& .MuiChip-icon': { color: '#10B981' } }}
          />
        </Tooltip>
      )}
      <Tooltip title={!user ? 'Đăng nhập để lưu cấu hình' : linked ? (dirty ? `Ghi đè "${linked.name}"` : 'Không có thay đổi') : 'Lưu cấu hình hiện tại'}>
        <span>
          <Button
            variant="contained" size="small" startIcon={<SaveIcon />} onClick={primary}
            disabled={busy || empty || (!!linked && !dirty)}
          >
            {linked && !dirty ? 'Đã lưu' : 'Lưu'}
          </Button>
        </span>
      </Tooltip>
      {user && linked && (
        <Tooltip title="Tùy chọn lưu">
          <IconButton size="small" onClick={e => setMenu(e.currentTarget)} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }} aria-label="Tùy chọn lưu">
            <MoreIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => { setMenu(null); setError(null); setDialog(true) }}>
          <ListItemIcon><SaveAsIcon fontSize="small" /></ListItemIcon>Lưu thành cấu hình mới…
        </MenuItem>
        <MenuItem onClick={() => { setMenu(null); unlink(key) }}>
          <ListItemIcon><UnlinkIcon fontSize="small" /></ListItemIcon>Bỏ liên kết
        </MenuItem>
      </Menu>

      <ConfigFormDialog
        open={dialog}
        title={linked ? 'Lưu thành cấu hình mới' : 'Lưu cấu hình'}
        submitLabel="Lưu"
        initialName={linked ? `${linked.name} (bản mới)` : suggestedName}
        error={error}
        busy={busy}
        onClose={() => setDialog(false)}
        onSubmit={saveNew}
      />
    </Box>
  )
}

export default SaveConfigButton
