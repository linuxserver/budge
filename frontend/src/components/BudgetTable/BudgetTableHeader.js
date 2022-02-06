import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveBudget, setCurrentMonth } from '../../redux/slices/Budgets'
import IconButton from '@mui/material/IconButton'
import { formatMonthFromDateString, getDateFromString } from '../../utils/Date'
import { isZero } from 'dinero.js'
import { getBalanceColor, inputToDinero, intlFormat, valueToDinero } from '../../utils/Currency'
import BudgetMonthPicker from '../BudgetMonthPicker'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/styles'
import Typography from '@mui/material/Typography'
import { usePopupState, bindTrigger } from 'material-ui-popup-state/hooks'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import ExpandMore from '@mui/icons-material/ExpandMore'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'

export default function BudgetTableHeader(props) {
  const theme = useTheme()
  const dispatch = useDispatch()

  const month = useSelector(state => state.budgets.currentMonth)
  const availableMonths = useSelector(state => state.budgets.availableMonths)
  const budget = useSelector(selectActiveBudget)

  const toBeBudgeted = budget ? valueToDinero(budget.toBeBudgeted) : inputToDinero(0)

  const nextMonth = getDateFromString(month)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const nextMonthDisabled = !availableMonths.includes(formatMonthFromDateString(nextMonth))

  const prevMonth = getDateFromString(month)
  prevMonth.setMonth(prevMonth.getMonth() - 1)
  const prevMonthDisabled = !availableMonths.includes(formatMonthFromDateString(prevMonth))

  const monthPickerPopupState = usePopupState({
    variant: 'popover',
    popupId: 'monthPicker',
  })

  const navigateMonth = direction => {
    props.onMonthNavigate(true)
    const monthDate = new Date(Date.UTC(...month.split('-')))
    monthDate.setDate(1)
    monthDate.setMonth(monthDate.getMonth() + direction)
    dispatch(setCurrentMonth({ month: formatMonthFromDateString(monthDate) }))
  }

  const isToday = month === formatMonthFromDateString(new Date())

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: theme.palette.background.tableHeader,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ p: 2 }}>
        <div>
          <BudgetMonthPicker
            popupState={monthPickerPopupState}
            currentMonth={month}
            minDate={availableMonths[0]}
            maxDate={availableMonths[availableMonths.length - 1]}
          />
          <div className="budget-month-navigation">
            <IconButton
              disabled={prevMonthDisabled}
              onClick={() => navigateMonth(-1)}
              sx={{
                fontSize: theme.typography.h6.fontSize,
                color: 'white',
              }}
            >
              <ArrowBackIosIcon fontSize="large" variant="outlined" />
            </IconButton>
            <Button
              {...bindTrigger(monthPickerPopupState)}
              sx={{
                fontSize: theme.typography.h6.fontSize,
                fontWeight: 'bold',
                color: theme.palette.secondary.main,
                pl: 2,
              }}
            >
              {new Date(Date.UTC(...month.split('-'))).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
              })}
            </Button>
            <IconButton
              disabled={nextMonthDisabled}
              onClick={() => navigateMonth(1)}
              sx={{
                fontSize: theme.typography.h6.fontSize,
                // [`.Mui-disabled`]: { color: theme.palette.grey[500] },
                color: 'white',
              }}
            >
              <ArrowForwardIosIcon fontSize="large" />
            </IconButton>
            {isToday === false && (
              <Button
                variant="outlined"
                size="small"
                color="secondary"
                onClick={() => dispatch(setCurrentMonth({ month: formatMonthFromDateString(new Date()) }))}
                sx={{ ml: 1 }}
              >
                <Typography style={{ fontSize: theme.typography.caption.fontSize, fontWeight: 'bold' }}>
                  Today
                </Typography>
              </Button>
            )}
          </div>
        </div>

        <Box
          sx={{
            py: 0.5,
            px: 2,
            borderRadius: 1.5,
            // backgroundColor: !isZero(toBeBudgeted) ? getBalanceColor(toBeBudgeted, theme) : theme.palette.grey[500],
          }}
        >
          <Stack direction="column" justifyContent="center" alignItems="center" spacing={0}>
            <Typography
              style={{
                fontSize: theme.typography.h5.fontSize,
                fontWeight: 'bold',
                // color: 'black',
                color: !isZero(toBeBudgeted) ? getBalanceColor(toBeBudgeted, theme) : theme.palette.grey[500],
              }}
            >
              {intlFormat(toBeBudgeted)}
            </Typography>
            <Typography
              style={{
                fontSize: theme.typography.subtitle1.fontSize,
                // color: 'black',
                color: 'white',
              }}
            >
              Available To Budget
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}
