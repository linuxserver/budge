import Box from '@mui/material/Box'
import { useSelector, useDispatch } from 'react-redux'
import { getBalanceColor, inputToDinero, intlFormat, valueToDinero } from '../utils/Currency'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import { useTheme } from '@mui/styles'
import Stack from '@mui/material/Stack'
import { isPositive, isZero } from 'dinero.js'
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'
import { formatMonthFromDateString, getDateFromString } from '../utils/Date'
import BudgetMonthPicker from './BudgetMonthPicker'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { usePopupState, bindTrigger } from 'material-ui-popup-state/hooks'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import { selectActiveBudget, setCurrentMonth } from '../redux/slices/Budgets'
import Paper from '@mui/material/Paper'

export default function BudgetDetails(props) {
  const theme = useTheme()
  const dispatch = useDispatch()

  const month = useSelector(state => state.budgets.currentMonth)
  const budgetMonth = useSelector(state => {
    return state.budgetMonths.entities[month] || null
  })

  const income = budgetMonth ? valueToDinero(budgetMonth.income) : inputToDinero(0)
  const activity = budgetMonth ? valueToDinero(budgetMonth.activity) : inputToDinero(0)
  const budgeted = budgetMonth ? valueToDinero(budgetMonth.budgeted) : inputToDinero(0)
  const underfunded = budgetMonth ? valueToDinero(budgetMonth.underfunded) : inputToDinero(0)

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
    const monthDate = new Date(Date.UTC(...month.split('-')))
    monthDate.setDate(1)
    monthDate.setMonth(monthDate.getMonth() + direction)
    dispatch(setCurrentMonth({ month: formatMonthFromDateString(monthDate) }))
  }

  const isToday = month === formatMonthFromDateString(new Date())

  return (
    <Stack
      direction="column"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      sx={{ p: 2, height: '100%' }}
    >
      <Stack direction="column" justifyContent="flex-start" alignItems="center" spacing={2} sx={{ width: '100%' }}>
        <Box sx={{ width: '100%' }}>
          <BudgetMonthPicker
            popupState={monthPickerPopupState}
            currentMonth={month}
            minDate={availableMonths[0]}
            maxDate={availableMonths[availableMonths.length - 1]}
          />
          <Stack
            className="budget-month-navigation"
            direction="row"
            justifyContent="space-around"
            alignItems="center"
            sx={{ width: '100%', margin: 'auto' }}
          >
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
        </Box>

        <Paper sx={{ width: '90%' }}>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
            sx={{ p: 2, width: '100%' }}
          >
            <Box>
              <Typography
                style={{
                  fontSize: theme.typography.h6.fontSize,
                }}
              >
                Available to Budget
              </Typography>
            </Box>

            <Box>
              <Typography
                style={{
                  fontSize: theme.typography.h5.fontSize,
                  fontWeight: 'bold',
                  color: !isZero(toBeBudgeted) ? getBalanceColor(toBeBudgeted, theme) : theme.palette.grey[500],
                }}
              >
                {intlFormat(toBeBudgeted)}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ width: '90%', p: 2 }}>
          <Typography
            sx={{
              fontSize: theme.typography.h5.fontSize,
            }}
          >
            Monthly Breakdown
          </Typography>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', pb: 2, borderBottom: `1px solid ${theme.palette.action.disabled}` }}
          >
            <Box>Income</Box>
            <Box>{intlFormat(income)}</Box>
          </Stack>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', pb: 2, pt: 2, borderBottom: `1px solid ${theme.palette.action.disabled}` }}
          >
            <Box>Activity</Box>
            <Box>{intlFormat(activity)}</Box>
          </Stack>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', pb: 2, pt: 2, borderBottom: `1px solid ${theme.palette.action.disabled}` }}
          >
            <Box>Budgeted</Box>
            <Box>{intlFormat(budgeted)}</Box>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%', pt: 2 }}>
            <Box>Underfunded</Box>
            <Box> {intlFormat(underfunded)}</Box>
          </Stack>
        </Paper>
      </Stack>

      <Box
        sx={{
          width: '100%',
        }}
      >
        {isPositive(underfunded) && !isZero(underfunded) && (
          <Alert variant="filled" severity="error">
            You have overspent your budget this month! Your budget may not be accurate until you resolve any negative
            balances.
          </Alert>
        )}
      </Box>
    </Stack>
  )
}
