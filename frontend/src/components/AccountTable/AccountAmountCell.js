import { useState, useEffect } from 'react'
import TextField from '@mui/material/TextField'
import { inputToDinero, intlFormat } from '../../utils/Currency'
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

export default function BudgetTableAssignedCell({ value, ...props }) {
  const theme = useTheme()
  const month = useSelector(state => state.budgets.currentMonth)
  // const [rowValue, setRowValue] = useState(toUnit(amount, { digits: 2 }))

  // useEffect(() => {
  //   setRowValue(intlFormat(amount))
  // }, [amount])

  const onFocus = async e => {
    e.target.select()
  }

  const onChange = e => {
    // const operators = ['+', '-', '*', '/']
    let value = e.target.value

    // if (operators.includes(value)) {
    //   if (operators.includes(props.rowData.amount[props.rowData.amount.length - 1])) {
    //     value = `${props.rowData.amount.slice(0, -1)}${value}`
    //   } else {
    //     value = `${props.rowData.amount}${value}`
    //   }
    // } else {
    //   value = e.target.value
    // }

    props.onChange(value)
  }

  // const onKeyPress = e => {
  //   if (e.key === 'Enter') {
  //     try {
  //       const newValue = inputToDinero(mexp.eval(rowValue))
  //       setRowValue(intlFormat(newValue))
  //       onSubmit(newValue, month)
  //       e.target.blur()
  //     } catch (e) {}
  //   }
  // }

  return (
    <BudgetCell
      {...props}
      id="standard-basic"
      variant="standard"
      size="small"
      value={value}
      onFocus={onFocus}
      // onBlur={onBlur}
      onChange={onChange}
      // onKeyPress={onKeyPress}
      fullWidth
      inputProps={{
        sx: {
          textAlign: 'right',
          fontSize: theme.typography.subtitle2.fontSize,
          // fontWeight: 'bold',
          padding: 0,
          borderBottom: 0,
          // ...(isZero(amount) && { color: theme.palette.grey[600] }),
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
