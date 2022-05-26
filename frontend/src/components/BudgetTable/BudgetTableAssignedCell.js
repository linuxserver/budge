import { useState, useEffect } from 'react'
import TextField from '@mui/material/TextField'
import { Currency } from '../../utils/Currency'
import { useTheme } from '@mui/styles'
import { isZero, toUnit } from 'dinero.js'
import { styled } from '@mui/material/styles'
import { useSelector } from 'react-redux'
import InputAdornment from '@mui/material/InputAdornment'
import CalculateIcon from '@mui/icons-material/Calculate'
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined'
import IconButton from '@mui/material/IconButton'
import mexp from 'math-expression-evaluator'

const BudgetCell = styled(TextField)(({ theme }) => ({
  '& .MuiInput-root:before': {
    borderBottom: '0px',
  },
  '.MuiInputAdornment-root .MuiSvgIcon-root': {
    display: 'none',
  },
  '&:hover .MuiInputAdornment-root .MuiSvgIcon-root': {
    display: 'flex',
  },
  '& .Mui-focused .MuiInputAdornment-root .MuiSvgIcon-root': {
    display: 'flex',
  },
}))

export default function BudgetTableAssignedCell({ budgeted, onSubmit }) {
  const theme = useTheme()
  const month = useSelector(state => state.budgets.currentMonth)
  const [rowValue, setRowValue] = useState(Currency.intlFormat(budgeted))

  useEffect(() => {
    setRowValue(Currency.intlFormat(budgeted))
  }, [budgeted])

  const onFocus = async e => {
    await setRowValue(toUnit(budgeted, { digits: 2 }))
    e.target.select()
  }

  const onBlur = async () => {
    await setRowValue(Currency.intlFormat(budgeted))
  }

  const onChange = e => {
    const operators = ['+', '-', '*', '/']
    const value = e.target.value

    if (operators.includes(value)) {
      if (operators.includes(rowValue[rowValue.length - 1])) {
        setRowValue(`${rowValue.slice(0, -1)}${value}`)
      } else {
        setRowValue(`${rowValue}${value}`)
      }
    } else {
      setRowValue(e.target.value)
    }
  }

  const onKeyPress = e => {
    if (e.key === 'Enter') {
      try {
        const fixedValue = rowValue.replace(/\d+\.?\d*/g, (match, contents, offset, input) => {
          return Currency.inputToValue(match)
        })

        const newValue = Currency.valueToDinero(mexp.eval(fixedValue))
        setRowValue(Currency.intlFormat(newValue))
        onSubmit(newValue, month)
        e.target.blur()
      } catch (e) {
        console.log(e)
      }
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
          // fontWeight: 'bold',
          padding: 0,
          borderBottom: 0,
          ...(isZero(budgeted) && { color: theme.palette.grey[600] }),
        },
      }}
      // InputProps={{
      //   startAdornment: (
      //     <InputAdornment position="start">
      //       {/* <IconButton> */}
      //       <CalculateOutlinedIcon color="primary" fontSize="small" />
      //       {/* </IconButton> */}
      //     </InputAdornment>
      //   ),
      // }}
    />
  )
}
