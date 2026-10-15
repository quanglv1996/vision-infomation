import React from 'react'
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: React.ReactNode
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Yes/no confirmation for destructive actions. */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, title, message, confirmLabel = 'Xác nhận', danger = false, busy = false, onConfirm, onClose,
}) => (
  <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>{title}</DialogTitle>
    <DialogContent>
      <Typography component="div" sx={{ fontSize: '0.86rem', color: '#CBD5E1', lineHeight: 1.6 }}>{message}</Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} disabled={busy}>Hủy</Button>
      <Button
        variant="contained" color={danger ? 'error' : 'primary'} onClick={onConfirm} disabled={busy}
        startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined}
        sx={danger ? { background: '#DC2626', boxShadow: 'none', '&:hover': { background: '#B91C1C' } } : undefined}
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
)

export default ConfirmDialog
