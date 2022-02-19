import React, { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import DatePicker from '@mui/lab/DatePicker'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import { useTheme } from '@mui/styles'
import EventIcon from '@mui/icons-material/Event'

function DatePickerIcon(props) {
  const theme = useTheme()
  return <EventIcon fontSize="small" {...props} sx={{ fontSize: theme.typography.subtitle1.fontSize }} />
}

export default function TransactionDatePicker(props) {
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  const onFocus = () => {
    setOpen(true)
  }

  const onBlur = () => {
    setOpen(false)
  }

  return (
    <Box
      sx={{
        ['& .MuiFormControl-root']: { m: 0, padding: '1px' },
      }}
    >
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label=""
          // open={open}
          value={props.value || null}
          onChange={props.onChange}
          InputAdornmentProps={{
            sx: {
              fontSize: theme.typography.caption.fontSize,
              [`& .MuiButtonBase-root`]: { p: 0 },
              [`& .MuiButtonBase-root`]: { p: 0 },
            },
          }}
          components={{
            OpenPickerIcon: DatePickerIcon,
          }}
          renderInput={params => {
            return (
              <TextField
                onKeyDown={props.onKeyDown}
                sx={{ minWidth: 125 }}
                onFocus={onFocus}
                onBlur={onBlur}
                margin="dense"
                {...params}
                InputProps={{
                  style: {
                    fontSize: theme.typography.subtitle2.fontSize,
                  },
                  ...params.InputProps,
                }}
                inputProps={{
                  ...params.inputProps,
                  form: {
                    autoComplete: 'off',
                  },
                  sx: {
                    p: 0,
                    px: 1,
                  },
                }}
              />
            )
          }}
        />
      </LocalizationProvider>
    </Box>
  )
}
