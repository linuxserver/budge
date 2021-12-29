import React from "react";
import { useDispatch } from "react-redux"
import { setCurrentMonth } from "../../redux/slices/Budgets";
import IconButton from '@mui/material/IconButton';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { formatMonthFromDateString, getDateFromString } from "../../utils/Date";
import Grid from '@mui/material/Grid';
import { isNegative } from 'dinero.js'
import { inputToDinero, intlFormat } from '../../utils/Currency'
import BudgetMonthPicker from "../BudgetMonthPicker";
import Button from '@mui/material/Button';
import { useTheme } from '@mui/styles'
import Typography from '@mui/material/Typography'
import {
  usePopupState,
  bindTrigger,
} from 'material-ui-popup-state/hooks'
import CategoryGroupForm from '../CategoryGroupForm'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box';

export default function BudgetTableHeader(props) {
  const theme = useTheme()
  const dispatch = useDispatch()

  const month = props.month
  const availableMonths = props.availableMonths
  const budget = props.budget

  const toBeBudgeted = budget ? budget.toBeBudgeted : inputToDinero(0)
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

  const navigateMonth = (direction) => {
    const monthDate = new Date(Date.UTC(...month.split('-')))
    monthDate.setDate(1)
    monthDate.setMonth(monthDate.getMonth() + direction)
    dispatch(setCurrentMonth(monthDate))
  }

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ p: 2 }}
      >
        <div>
          <BudgetMonthPicker
            popupState={monthPickerPopupState}
            currentMonth={month}
            minDate={availableMonths[0]}
            maxDate={availableMonths[availableMonths.length - 1]}
          />
          <div className="budget-month-navigation">
            <IconButton disabled={prevMonthDisabled} onClick={() => navigateMonth(-1)}>
              <ArrowBackIosNewIcon />
            </IconButton>
            <Button {...bindTrigger(monthPickerPopupState)}>
              {(new Date(Date.UTC(...month.split('-')))).toLocaleDateString(undefined, { year: 'numeric', month: 'short'})}
            </Button>
            <IconButton disabled={nextMonthDisabled} onClick={() => navigateMonth(1)}>
              <ArrowForwardIosIcon />
            </IconButton>
            <Button variant="outlined" size="small" onClick={() => dispatch(setCurrentMonth(new Date()))}>
              <Typography style={{ fontSize: theme.typography.caption.fontSize, fontWeight: 'bold' }}>
                Today
              </Typography>
            </Button>
          </div>
        </div>

        <div>
          <Typography style={{ fontSize: theme.typography.h6.fontSize, fontWeight: 'bold' }}>
            To Be Budgeted: <span style={{ color: theme.palette[tbbColor].main }}>{intlFormat(toBeBudgeted)}</span>
          </Typography>
        </div>
      </Stack>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ p: 2 }}
      >
        <div>
          <CategoryGroupForm
            popupState={categoryGroupPopupState}
            mode={'create'}
            order={0}
          />
          <Button
            aria-describedby="category-group-add"
            // variant="outlined"
            size="small"
            {...bindTrigger(categoryGroupPopupState)}
          >
            <Typography style={{ fontSize: theme.typography.caption.fontSize, fontWeight: 'bold' }}>
              + Category Group
            </Typography>
          </Button>
        </div>
      </Stack>
    </Box>
  )
}
