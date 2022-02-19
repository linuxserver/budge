import TextField from '@mui/material/TextField'
import { useTheme } from '@mui/styles'

export default function BudgetTableAssignedCell({ value, onChange, ...props }) {
  const theme = useTheme()

  const onFocus = async e => {
    e.target.select()
  }

  const change = e => {
    onChange(e.target.value)
  }

  return (
    <TextField
      {...props}
      size="small"
      fullWidth
      inputProps={{
        sx: {
          textAlign: 'right',
          py: 0,
          px: 1,
          fontSize: theme.typography.subtitle2.fontSize,
          // height: 1,
        },
      }}
      InputProps={{
        sx: {
          paddingBottom: '1px',
        },
      }}
      value={value}
      onFocus={onFocus}
      onChange={change}
    />
  )
}
