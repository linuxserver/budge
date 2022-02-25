import React from 'react'
import { accountsSelectors } from '../redux/slices/Accounts'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { Currency, FromAPI } from '../utils/Currency'
import { formatMonthFromDateString } from '../utils/Date'
import { useTheme } from '@mui/styles'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

export default function CategoryMonthActivity(props) {
  const theme = useTheme()

  const month = useSelector(state => state.budgets.currentMonth.split('-'))
  const accounts = useSelector(accountsSelectors.selectAll)
  const selectedCategory = useSelector(state => {
    if (!state.categories.selected) {
      return null
    }

    return state.categories.entities[state.categories.selected]
  })
  const payees = useSelector(state => state.payees.entities)

  if (!selectedCategory) {
    return <>No category selected</>
  }

  const transactions = accounts.reduce((total, account) => {
    const filtered = Object.values(account.transactions.entities).filter(trx => {
      const trxDate = trx.date.split('-')
      if (trx.categoryId !== selectedCategory.id) {
        return false
      }

      if (trxDate[0] === month[0] && trxDate[1] === month[1]) {
        return true
      }

      return false
    })

    return total.concat(filtered)
  }, [])

  if (transactions.length === 0) {
    return <Box>No transactions for this month</Box>
  }

  return (
    <Box>
      <TableContainer sx={{ maxHeight: 300 }}>
        <Table stickyHeader size="small">
          <TableBody>
            {transactions.map(transaction => {
              transaction = FromAPI.transformTransaction(transaction)
              return (
                <TableRow>
                  <Tooltip
                    arrow
                    title={
                      <React.Fragment>
                        <Typography sx={{ fontSize: theme.typography.caption.fontSize }}>
                          Date: {formatMonthFromDateString(transaction.date)}
                        </Typography>
                        <Typography sx={{ fontSize: theme.typography.caption.fontSize }}>
                          Account: {accounts.find(acct => acct.id === transaction.accountId).name}
                        </Typography>
                        <Typography sx={{ fontSize: theme.typography.caption.fontSize }}>
                          Memo: {transaction.memo}{' '}
                        </Typography>
                      </React.Fragment>
                    }
                  >
                    <TableCell sx={{ pl: 1, pr: 0, width: 10 }}>
                      <InfoOutlinedIcon fontSize="small" sx={{ verticalAlign: 'middle' }} />
                    </TableCell>
                  </Tooltip>
                  <TableCell>{payees[transaction.payeeId].name}</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{Currency.intlFormat(transaction.amount)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
