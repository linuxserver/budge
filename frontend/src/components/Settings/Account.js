import React, { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { useDispatch } from 'react-redux'
import { updateUser } from '../../redux/slices/Users'

export default function Account({ index, value, close, ...props }) {
  const dispatch = useDispatch()

  const [email, setEmail] = useState(props.email)
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordAgain, setPasswordAgain] = useState('')

  const submit = async () => {
    if (password !== passwordAgain) {
      // error
    }

    if (password && !currentPassword) {
      // error
    }

    const payload = { email, ...(password && currentPassword && { password, currentPassword }) }

    await dispatch(updateUser(payload))
    close()
  }

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...props}
    >
      {value === index && (
        <Stack direction="column" justifyContent="flex-end" alignItems="space-around" spacing={2} sx={{ pt: 2 }}>
          <Box component="form" noValidate autoComplete="off" sx={{ py: 2 }}>
            <TextField
              value={email}
              onChange={e => setEmail(e.target.value)}
              variant="standard"
              label="Email"
              fullWidth
            />
            <TextField
              value={currentPassword}
              type="password"
              onChange={e => setCurrentPassword(e.target.value)}
              variant="standard"
              label="Current Password"
              fullWidth
            />
            <TextField
              value={password}
              type="password"
              onChange={e => setPassword(e.target.value)}
              variant="standard"
              label="New Password"
              fullWidth
            />
            <TextField
              value={passwordAgain}
              type="password"
              onChange={e => setPasswordAgain(e.target.value)}
              variant="standard"
              label="Repeat New Password"
              fullWidth
            />
          </Box>

          <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ pt: 2 }}>
            <Button size="small" onClick={submit}>
              SAVE
            </Button>
          </Stack>
        </Stack>
      )}
    </div>
  )
}
