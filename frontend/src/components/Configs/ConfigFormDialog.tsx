import React, { useEffect, useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'
import { TEXT_INPUT_SX } from '@/components/Auth/AuthDialog'

interface ConfigFormDialogProps {
  open: boolean
  title: string
  submitLabel: string
  initialName?: string
  initialDescription?: string
  error?: string | null
  busy?: boolean
  onClose: () => void
  onSubmit: (name: string, description: string) => void
}

/** Name + description form used to save, save-as and rename configurations. */
const ConfigFormDialog: React.FC<ConfigFormDialogProps> = ({
  open, title, submitLabel, initialName = '', initialDescription = '', error, busy, onClose, onSubmit,
}) => {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  useEffect(() => { if (open) { setName(initialName); setDescription(initialDescription) } }, [open, initialName, initialDescription])

  const valid = name.trim().length > 0
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Stack component="form" onSubmit={e => { e.preventDefault(); if (valid && !busy) onSubmit(name.trim(), description.trim()) }}>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>{title}</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField
              label="Tên cấu hình" value={name} onChange={e => setName(e.target.value)} autoFocus fullWidth
              placeholder="VD: Line 3 — kiểm tra nắp chai" inputProps={{ maxLength: 120 }} sx={TEXT_INPUT_SX}
            />
            <TextField
              label="Mô tả / ghi chú" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline minRows={3}
              placeholder="Khách hàng, yêu cầu, lý do chọn thông số…" inputProps={{ maxLength: 2000 }} sx={TEXT_INPUT_SX}
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="submit" variant="contained" disabled={!valid || busy}>{submitLabel}</Button>
        </DialogActions>
      </Stack>
    </Dialog>
  )
}

export default ConfigFormDialog
