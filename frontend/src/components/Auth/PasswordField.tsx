import React, { useState } from 'react'
import { IconButton, InputAdornment, TextField, type TextFieldProps } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'

/** Password input with a show/hide toggle. */
const PasswordField: React.FC<TextFieldProps> = props => {
  const [show, setShow] = useState(false)
  return (
    <TextField
      {...props}
      type={show ? 'text' : 'password'}
      InputProps={{
        ...props.InputProps,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton size="small" edge="end" tabIndex={-1} onClick={() => setShow(s => !s)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
              {show ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  )
}

export default PasswordField

/** Same rule as the backend (min 8 chars). */
export const passwordProblem = (pw: string): string | null =>
  pw.length === 0 ? null : pw.length < 8 ? 'Tối thiểu 8 ký tự' : null
