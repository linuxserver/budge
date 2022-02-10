import Box from '@mui/material/Box'
import { useSelector, useDispatch } from 'react-redux'
import { inputToDinero, intlFormat, valueToDinero, getBalanceColor } from '../utils/Currency'
import { useTheme } from '@mui/styles'
import Stack from '@mui/material/Stack'
import { isPositive, isZero } from 'dinero.js'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import { selectActiveBudget } from '../redux/slices/Budgets'
import Paper from '@mui/material/Paper'
import BudgetMonthCalculation from './BudgetTable/BudgetMonthCalculation'
import CategoryMonthActivity from './CategoryMonthActivity'
import BudgetMonthNavigator from './BudgetMonthNavigator'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import { setSelectedCategory } from '../redux/slices/Categories'

export default function BudgetDetails(props) {
  const theme = useTheme()
  const dispatch = useDispatch()

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
      sx={{ px: 2, height: '100%' }}
    >
      <Box sx={{ width: '100%' }}>
        <Stack direction="column" justifyContent="flex-start" alignItems="center" spacing={2} sx={{ width: '100%' }}>
          <BudgetMonthNavigator mini={false} />

          <Box sx={{ width: '100%' }}>
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
          </Box>

          <Box sx={{ width: '100%' }}>
            <Paper sx={{ p: 2, mx: 2 }}>
              <Typography
                sx={{
                  fontSize: theme.typography.h6.fontSize,
                  pb: 2,
                }}
              >
                Monthly Summary
              </Typography>

              <BudgetMonthCalculation />

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ width: '100%', mt: 1, pt: 1, borderTop: `1px solid ${theme.palette.action.disabled}` }}
              >
                <Box>Underfunded</Box>
                <Box> {intlFormat(underfunded)}</Box>
              </Stack>
            </Paper>
          </Box>

          {selectedCategory && (
            <Box sx={{ width: '100%' }}>
              <Card sx={{ mx: 2 }}>
                <CardContent>
                  <Typography
                    sx={{
                      fontSize: theme.typography.h6.fontSize,
                      pb: 1,
                    }}
                  >
                    {selectedCategory.name} Activity
                  </Typography>

                  <CategoryMonthActivity />
                </CardContent>

                <CardActions>
                  <Button size="small" onClick={clearSelectedCategory}>
                    Close
                  </Button>
                </CardActions>
              </Card>
            </Box>
          )}
        </Stack>
      </Box>

      <Box
        sx={{
          m: 4,
          pb: 2,
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
