import Box from '@mui/material/Box'
import { useSelector, useDispatch } from 'react-redux'
import { useTheme } from '@mui/styles'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import { formatMonthFromDateString, getDateFromString } from '../utils/Date'
import BudgetMonthPicker from './BudgetMonthPicker'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { usePopupState, bindTrigger } from 'material-ui-popup-state/hooks'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import { selectActiveBudget, setCurrentMonth } from '../redux/slices/Budgets'
import EventIcon from '@mui/icons-material/Event'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'

export default function BudgetMonthNavigator({ mini }) {
  const theme = useTheme()
  const dispatch = useDispatch()

  const month = useSelector(state => state.budgets.currentMonth)
  const availableMonths = useSelector(state => state.budgets.availableMonths)

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
    const monthDate = new Date(Date.UTC(...month.split('-')))
    monthDate.setDate(1)
    monthDate.setMonth(monthDate.getMonth() + direction)
    dispatch(setCurrentMonth({ month: formatMonthFromDateString(monthDate) }))
  }

  const isToday = month === formatMonthFromDateString(new Date())

  if (mini === true) {
    return (
      <List>
        <BudgetMonthPicker
          popupState={monthPickerPopupState}
          currentMonth={month}
          minDate={availableMonths[0]}
          maxDate={availableMonths[availableMonths.length - 1]}
        />
        <ListItem button>
          <EventIcon
            fontSize="large"
            {...bindTrigger(monthPickerPopupState)}
            sx={{
              fontSize: theme.typography.h6.fontSize,
              // [`.Mui-disabled`]: { color: theme.palette.grey[500] },
              color: 'white',
            }}
          />
        </ListItem>
      </List>
    )
  }

  return (
    <Stack className="budget-month-navigation" direction="row" justifyContent="space-evenly" alignItems="center">
      <BudgetMonthPicker
        popupState={monthPickerPopupState}
        currentMonth={month}
        minDate={availableMonths[0]}
        maxDate={availableMonths[availableMonths.length - 1]}
      />
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

      <Stack direction="column" justifyContent="space-around" alignItems="center" sx={{ minHeight: '80px' }}>
        <Button
          {...bindTrigger(monthPickerPopupState)}
          sx={{
            fontSize: theme.typography.h6.fontSize,
            fontWeight: 'bold',
            color: theme.palette.secondary.main,
          }}
        >
          {new Date(Date.UTC(...month.split('-'))).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
          })}
        </Button>

        <Button
          variant="outlined"
          size="small"
          color="secondary"
          disabled={isToday}
          onClick={() => dispatch(setCurrentMonth({ month: formatMonthFromDateString(new Date()) }))}
        >
          <Typography style={{ fontSize: theme.typography.caption.fontSize, fontWeight: 'bold' }}>
            Jump to Today
          </Typography>
        </Button>
      </Stack>

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
    </Stack>
  )
}
