import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveBudget, setCurrentMonth } from '../../redux/slices/Budgets'
import IconButton from '@mui/material/IconButton'
import { formatMonthFromDateString, getDateFromString } from '../../utils/Date'
import { isNegative } from 'dinero.js'
import { getBalanceColor, inputToDinero, intlFormat, valueToDinero } from '../../utils/Currency'
import BudgetMonthPicker from '../BudgetMonthPicker'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/styles'
import Typography from '@mui/material/Typography'
import { usePopupState, bindTrigger } from 'material-ui-popup-state/hooks'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import ArrowCircleLeftOutlinedIcon from '@mui/icons-material/ArrowCircleLeftOutlined'
import ArrowCircleRightOutlinedIcon from '@mui/icons-material/ArrowCircleRightOutlined'
import ExpandMore from '@mui/icons-material/ExpandMore'

export default function BudgetTableHeader(props) {
  const theme = useTheme()
  const dispatch = useDispatch()

  const month = useSelector(state => state.budgets.currentMonth)
  const availableMonths = useSelector(state => state.budgets.availableMonths)
  const budget = useSelector(selectActiveBudget)

  const toBeBudgeted = budget ? valueToDinero(budget.toBeBudgeted) : inputToDinero(0)
  let tbbColor = 'success'
  if (isNegative(toBeBudgeted)) {
    tbbColor = 'error'
  }

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

  const categoryGroupPopupState = usePopupState({
    variant: 'popover',
    popupId: 'categoryGroup',
  })

  const navigateMonth = direction => {
    props.onMonthNavigate(true)
    const monthDate = new Date(Date.UTC(...month.split('-')))
    monthDate.setDate(1)
    monthDate.setMonth(monthDate.getMonth() + direction)
    dispatch(setCurrentMonth(monthDate))
  }

  const isToday = month === formatMonthFromDateString(new Date())

  console.log(theme)
  return (
    <Box
      sx={
        {
          // backgroundColor: theme.palette.background.default
        }
      }
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
                color: theme.palette.primary.main,
              }}
            >
              <ArrowCircleLeftOutlinedIcon fontSize="large" />
            </IconButton>
            <Button
              {...bindTrigger(monthPickerPopupState)}
              sx={{
                fontSize: theme.typography.h6.fontSize,
                fontWeight: 'bold',
                color: theme.palette.text.primary,
              }}
            >
              {new Date(Date.UTC(...month.split('-'))).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
              })}
              <ExpandMore
                sx={{
                  color: theme.palette.primary.main,
                }}
              />
            </Button>
            <IconButton
              disabled={nextMonthDisabled}
              onClick={() => navigateMonth(1)}
              sx={{
                fontSize: theme.typography.h6.fontSize,
                color: theme.palette.primary.main,
              }}
            >
              <ArrowCircleRightOutlinedIcon fontSize="large" />
            </IconButton>
            {isToday === false && (
              <Button variant="outlined" size="small" onClick={() => dispatch(setCurrentMonth(new Date()))}>
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
            backgroundColor: getBalanceColor(toBeBudgeted, theme),
          }}
        >
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
            <Typography
              style={{
                fontSize: theme.typography.subtitle1.fontSize,
                // fontWeight: 'bold',
                color: theme.palette.background.default,
              }}
            >
              To Be Budgeted:
            </Typography>
            <Typography
              style={{
                fontSize: theme.typography.h6.fontSize,
                fontWeight: 'bold',
                color: theme.palette.background.default,
              }}
            >
              {intlFormat(toBeBudgeted)}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}
