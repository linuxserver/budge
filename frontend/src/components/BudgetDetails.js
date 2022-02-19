import React from 'react'
import Box from '@mui/material/Box'
import { useSelector, useDispatch } from 'react-redux'
import { inputToDinero, intlFormat, valueToDinero, getBalanceColor } from '../utils/Currency'
import { useTheme } from '@mui/styles'
import Stack from '@mui/material/Stack'
import { isPositive, isNegative, isZero, add } from 'dinero.js'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import { selectActiveBudget } from '../redux/slices/Budgets'
import Paper from '@mui/material/Paper'
import BudgetMonthCalculation from './BudgetTable/BudgetMonthCalculation'
import CategoryMonthActivity from './CategoryMonthActivity'
import BudgetMonthNavigator from './BudgetMonthNavigator'
import Button from '@mui/material/Button'
import { setSelectedCategory } from '../redux/slices/Categories'
import { accountsSelectors } from '../redux/slices/Accounts'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Divider from '@mui/material/Divider'

export default function BudgetDetails(props) {
  const theme = useTheme()
  const dispatch = useDispatch()

  const accounts = useSelector(accountsSelectors.selectAll)
  const balance = accounts.reduce((total, account) => {
    if (account.type === 2) {
      return total
    }
    return add(valueToDinero(account.balance), total)
  }, inputToDinero(0))
  const balanceColor = isNegative(balance) ? theme.palette.error.main : theme.palette.secondary.main

  const month = useSelector(state => state.budgets.currentMonth)
  const budgetMonth = useSelector(state => {
    return state.budgetMonths.entities[month] || null
  })

  const underfunded = budgetMonth ? valueToDinero(budgetMonth.underfunded) : inputToDinero(0)
  const budget = useSelector(selectActiveBudget)
  const toBeBudgeted = budget ? valueToDinero(budget.toBeBudgeted) : inputToDinero(0)

  const selectedCategory = useSelector(state => {
    if (!state.categories.selected) {
      return null
    }

    return state.categories.entities[state.categories.selected]
  })
  const clearSelectedCategory = () => {
    dispatch(setSelectedCategory(null))
  }

  return (
    <Stack
      direction="column"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      sx={{ p: 2, height: '100%' }}
    >
      <Box sx={{ width: '100%' }}>
        <Stack direction="column" justifyContent="flex-start" alignItems="center" spacing={2} sx={{ width: '100%' }}>
          <Box sx={{ width: '100%' }}>
            <Card sx={{ mx: 2 }}>
              <CardHeader
                title={<Box sx={{ fontSize: theme.typography.h6.fontSize, fontWeight: 'bold' }}>Balance</Box>}
                sx={{
                  backgroundColor: theme.palette.success.main,
                  // color: 'black',
                  p: 1,
                }}
              />
              <CardContent sx={{ p: '10px !important' }}>
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

                <Box sx={{ py: 1 }}>
                  <Divider />
                </Box>

                <Stack direction="row" spacing={4} justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography
                      style={{
                        fontSize: theme.typography.subtitle1.fontSize,
                      }}
                    >
                      Accounts
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      style={{
                        fontSize: theme.typography.subtitle1.fontSize,
                        // fontWeight: 'bold',
                        // color: balanceColor,
                      }}
                    >
                      {intlFormat(balance)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ width: '100%' }}>
            <Card sx={{ mx: 2 }}>
              <CardHeader
                title={<Box sx={{ fontSize: theme.typography.h6.fontSize, fontWeight: 'bold' }}>Monthly Summary</Box>}
                sx={{
                  backgroundColor: '#5bc0de',
                  // color: 'black',
                  p: 1,
                }}
              />
              <CardContent sx={{ p: '10px !important' }}>
                <BudgetMonthCalculation />
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ width: '100%' }}>
            <Card sx={{ mx: 2 }}>
              <CardHeader
                title={
                  <Box sx={{ fontSize: theme.typography.h6.fontSize, fontWeight: 'bold' }}>
                    {selectedCategory ? `${selectedCategory.name} Activity` : 'Activity'}
                  </Box>
                }
                sx={{
                  backgroundColor: theme.palette.error.main,
                  // color: 'black',
                  p: 1,
                }}
              />
              <CardContent sx={{ p: '10px !important' }}>
                <CategoryMonthActivity />
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          m: 4,
          width: '100%',
        }}
      >
        {isPositive(underfunded) && !isZero(underfunded) && (
          <Alert variant="filled" severity="error">
            You are {intlFormat(underfunded)} in self debt! Your budget may not be accurate until you resolve any
            negative balances.
          </Alert>
        )}
      </Box>
    </Stack>
  )
}
