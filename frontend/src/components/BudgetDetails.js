import Box from '@mui/material/Box'
import { useSelector } from 'react-redux'
import { inputToDinero, intlFormat, valueToDinero } from '../utils/Currency'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableRow from '@mui/material/TableRow'
import { selectActiveBudget } from '../redux/slices/Budgets'
import { useTheme } from '@mui/styles'
import Stack from '@mui/material/Stack'
import { isPositive, isZero } from 'dinero.js'

export default function BudgetDetails(props) {
  const theme = useTheme()

  const month = useSelector(state => state.budgets.currentMonth)
  const budgetMonth = useSelector(state => {
    return state.budgetMonths.entities[month] || null
  })

  const income = budgetMonth ? valueToDinero(budgetMonth.income) : inputToDinero(0)
  const activity = budgetMonth ? valueToDinero(budgetMonth.activity) : inputToDinero(0)
  const budgeted = budgetMonth ? valueToDinero(budgetMonth.budgeted) : inputToDinero(0)
  const underfunded = budgetMonth ? valueToDinero(budgetMonth.underfunded) : inputToDinero(0)

  console.log(theme)
  return (
    <Stack
      spacing={2}
      sx={{
        mt: 2,
        mr: 2,
        px: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.background.details,
        color: 'white',
      }}
    >
      <h3>
        {new Date(Date.UTC(...month.split('-')))
          .toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
          .toUpperCase()}{' '}
        SUMMARY
      </h3>

      <TableContainer>
        <Table aria-label="simple table">
          <TableBody>
            <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell sx={{ color: theme.palette.secondary.main }} align="left">
                Income
              </TableCell>
              <TableCell sx={{ color: theme.palette.secondary.main }} align="right">
                {intlFormat(income)}
              </TableCell>
            </TableRow>

            <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell sx={{ color: theme.palette.secondary.main }} align="left">
                Activity
              </TableCell>
              <TableCell sx={{ color: theme.palette.secondary.main }} align="right">
                {intlFormat(activity)}
              </TableCell>
            </TableRow>

            <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell sx={{ color: theme.palette.secondary.main }} align="left">
                Budgeted
              </TableCell>
              <TableCell sx={{ color: theme.palette.secondary.main }} align="right">
                {intlFormat(budgeted)}
              </TableCell>
            </TableRow>

            <TableRow
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
              }}
            >
              <TableCell
                align="left"
                sx={{
                  ...(isPositive(underfunded) &&
                    !isZero(underfunded) && {
                      color: theme.palette.error.main,
                    }),
                }}
              >
                Underfunded
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  ...(isPositive(underfunded) &&
                    !isZero(underfunded) && {
                      color: theme.palette.error.main,
                    }),
                }}
              >
                {intlFormat(underfunded)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}
