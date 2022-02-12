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
import Paper from '@mui/material/Paper'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import ExpandMore from '@mui/icons-material/ExpandMore'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import BudgetMonthNavigator from '../BudgetMonthNavigator'
import BudgetMonthCalculation from './BudgetMonthCalculation'
import Divider from '@mui/material/Divider'

export default function BudgetTableHeader(props) {
  const theme = useTheme()
  const dispatch = useDispatch()

  const month = useSelector(state => state.budgets.currentMonth)
  const availableMonths = useSelector(state => state.budgets.availableMonths)
  const budget = useSelector(selectActiveBudget)

  const toBeBudgeted = budget ? valueToDinero(budget.toBeBudgeted) : inputToDinero(0)

  const isToday = month === formatMonthFromDateString(new Date())

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: theme.palette.background.tableHeader,
      }}
    >
      <Stack direction="row" justifyContent="space-around" alignItems="center" spacing={2} sx={{ p: 2 }}>
        <BudgetMonthNavigator />

        {/* <Card sx={{ minWidth: 200 }}>
          <CardHeader
            title={<Box sx={{ fontSize: theme.typography.subtitle1.fontSize }}>Available</Box>}
            sx={{
              backgroundColor: 'green',
              p: 1,
            }}
          />
          <CardContent sx={{ p: '10px !important' }}>{intlFormat(toBeBudgeted)}</CardContent>
        </Card> */}

        <Paper sx={{ p: 2, mx: 2 }}>
          <Stack direction="row" spacing={4} justifyContent="space-between" alignItems="center">
            <Box>
              <Typography
                style={{
                  fontSize: theme.typography.h6.fontSize,
                }}
              >
                Available
              </Typography>
            </Box>

            <Divider />

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

        <Paper
          sx={{
            py: 1,
            px: 2,
          }}
        >
          <BudgetMonthCalculation />
        </Paper>
      </Stack>
    </Box>
  )
}
