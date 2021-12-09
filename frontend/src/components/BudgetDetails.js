import Box from '@mui/material/Box';
import { useSelector } from 'react-redux'
import { inputToDinero, intlFormat } from '../utils/Currency'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

export default function BudgetDetails(props) {
  const budget = useSelector(state => state.budgets.activeBudget)
  const month = useSelector(state => state.budgets.currentMonth)
  const budgetMonth = useSelector(state => {
    return state.budgets.budgetMonths[month]
  })

  const toBeBudgeted = budget ? budget.toBeBudgeted : inputToDinero(0)
  const income = budgetMonth ? budgetMonth.income : inputToDinero(0)
  const activity = budgetMonth ? budgetMonth.activity : inputToDinero(0)
  const budgeted = budgetMonth ? budgetMonth.budgeted : inputToDinero(0)
  const underfunded = budgetMonth ? budgetMonth.underfunded : inputToDinero(0)

  const rows = [
    {
      field: 'Income',
      value: intlFormat(income),
    },
    {
      field: 'Activity',
      value: intlFormat(activity),
    },
    {
      field: 'Budgeted',
      value: intlFormat(budgeted),
    },
    {
      field: 'Underfunded',
      value: intlFormat(underfunded),
    },
  ];

  return (
    <Box sx={{p: 2}}>
      <h3>
        {(new Date(Date.UTC(...month.split('-')))).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })} Summary
      </h3>
      <TableContainer>
        <Table aria-label="simple table">
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.field}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell align="left">{row.field}</TableCell>
                <TableCell align="right">{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
