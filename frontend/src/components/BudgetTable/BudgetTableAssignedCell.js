import { useState, useEffect } from 'react'
import TextField from '@mui/material/TextField'
import { inputToDinero, intlFormat } from '../../utils/Currency'
import { useTheme } from '@mui/styles'
import { isZero, toUnit } from 'dinero.js'
import { styled } from '@mui/material/styles'
import { useSelector } from 'react-redux'

const BudgetCell = styled(TextField)(({ theme }) => ({
  '& .MuiInput-root:before': {
    borderBottom: '0px',
  },
}))

export default function BudgetTableAssignedCell({ budgeted, onSubmit }) {
  const theme = useTheme()
  const month = useSelector(state => state.budgets.currentMonth)
  const [rowValue, setRowValue] = useState(intlFormat(budgeted))

  useEffect(() => {
    setRowValue(intlFormat(budgeted))
  }, [budgeted])

  const onFocus = async e => {
    await setRowValue(toUnit(budgeted, { digits: 2 }))
    e.target.select()
  }

  const onBlur = async () => {
    await setRowValue(intlFormat(budgeted))
  }

  const onChange = e => {
    setRowValue(e.target.value)
  }

  const onKeyPress = e => {
    if (e.key === 'Enter') {
      const newValue = inputToDinero(rowValue)
      setRowValue(intlFormat(newValue))
      onSubmit(newValue, month)
      e.target.blur()
    }
  }

  return (
    <BudgetCell
      id="standard-basic"
      variant="standard"
      size="small"
      value={rowValue}
      onFocus={onFocus}
      onBlur={onBlur}
      onChange={onChange}
      onKeyPress={onKeyPress}
      inputProps={{
        sx: {
          textAlign: 'right',
          fontSize: theme.typography.subtitle2.fontSize,
          fontWeight: 'bold',
          padding: 0,
          borderBottom: 0,
          ...(isZero(budgeted) && { color: theme.palette.grey[600] }),
        },
      }}
    />
  )
}
