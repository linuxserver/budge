import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import { useSelector, useDispatch } from 'react-redux'
import { FromAPI, Currency } from '../utils/Currency'
import { useTheme } from '@mui/styles'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import { accountsSelectors, editAccount, transactionsSelectors } from '../redux/slices/Accounts'
import TextField from '@mui/material/TextField'
import Popover from '@mui/material/Popover'
import { usePopupState, bindTrigger, bindPopover } from 'material-ui-popup-state/hooks'
import ReconcileForm from './ReconcileForm'
import { createSelector } from '@reduxjs/toolkit'
import Paper from '@mui/material/Paper'
import BalanceCalculation from './AccountTable/BalanceCalculation'
import EditIcon from '@mui/icons-material/Edit'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Table from '@mui/material/Table'
import TableContainer from '@mui/material/TableContainer'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import { add } from 'dinero.js'
import { formatMonthFromDateString } from '../utils/Date'

export default function BudgetDetails({ accountId, name }) {
  const theme = useTheme()
  const dispatch = useDispatch()

  const month = useSelector(state => state.budgets.currentMonth)
  const categories = useSelector(state => state.categories.entities)
  const selectAccount = createSelector(
    [(state, accountId) => accountsSelectors.selectById(state, accountId)],
    account => FromAPI.transformAccount(account),
  )
  const account = useSelector(state => selectAccount(state, accountId))

  const [accountName, setAccountName] = useState(name)
  useEffect(() => {
    setAccountName(name)
  }, [name])

  const editAccountPopupState = usePopupState({
    variant: 'popover',
    popupId: 'editAccount',
  })

  const reconcilePopupState = usePopupState({
    variant: 'popover',
    popupId: 'reconcile-popup',
  })

  const editAccountName = event => {
    editAccountPopupState.close()
    dispatch(editAccount({ id: account.id, name: accountName }))
  }

  const transactions = useSelector(state => {
    const monthCheck = month.split('-')
    return Object.values(account.transactions.entities).filter(trx => {
      const trxDate = trx.date.split('-')
      if (trxDate[0] === monthCheck[0] && trxDate[1] === monthCheck[1]) {
        return true
      }

      return false
    })
  })

  const [income, activity, pending] = transactions.reduce(
    (vals, trx) => {
      if (formatMonthFromDateString(trx.date) !== month) {
        return vals
      }

      if (!trx.categoryId) {
        // No category === transfer
        return vals
      }

      if (trx.status === 0) {
        vals[2]++
      }

      trx = FromAPI.transformTransaction(trx)
      if (categories[trx.categoryId].inflow === true) {
        vals[0] = add(vals[0], trx.amount)
      } else {
        vals[1] = add(vals[1], trx.amount)
      }

      return vals
    },
    [Currency.inputToDinero(0), Currency.inputToDinero(0), 0],
  )

  return (
    <Stack direction="column" justifyContent="flex-start" alignItems="center" spacing={2} sx={{ p: 2, height: '100%' }}>
      <Box sx={{ width: '100%' }}>
        <Card sx={{ mx: 2 }}>
          <CardHeader
            title={
              <Box>
                <Box
                  {...bindTrigger(editAccountPopupState)}
                  sx={{ fontWeight: 'bold', fontSize: theme.typography.subtitle1.fontSize, cursor: 'pointer' }}
                >
                  {account.name}
                </Box>
                <Popover
                  {...bindPopover(editAccountPopupState)}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                >
                  <Box sx={{ p: 2 }}>
                    <TextField
                      autoFocus
                      margin="dense"
                      id="account-name"
                      label="Account Name"
                      type="text"
                      fullWidth
                      variant="standard"
                      value={accountName}
                      onChange={e => setAccountName(e.target.value)}
                    />
                    <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
                      <Button size="small" sx={{ p: 1 }} onClick={editAccountName}>
                        Save
                      </Button>
                    </Stack>
                  </Box>
                </Popover>
              </Box>
            }
            sx={{
              backgroundColor: theme.palette.success.main,
              p: 1,
            }}
          />

          <CardContent sx={{ p: '10px !important' }}>
            <BalanceCalculation account={account} />

            <Box sx={{ pt: 2 }}>
              <Button {...bindTrigger(reconcilePopupState)} color="secondary" variant="outlined">
                <Typography style={{ fontSize: theme.typography.caption.fontSize, fontWeight: 'bold' }}>
                  Reconcile
                </Typography>
              </Button>
              <ReconcileForm
                key={account.cleared}
                popupState={reconcilePopupState}
                accountId={account.id}
                balance={account.cleared}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ width: '100%' }}>
        <Card sx={{ mx: 2 }}>
          <CardHeader
            title={
              <Box sx={{ fontWeight: 'bold', fontSize: theme.typography.subtitle1.fontSize }}>{`${new Date(
                Date.UTC(...month.split('-')),
              ).toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })} Activity`}</Box>
            }
            sx={{
              backgroundColor: '#5bc0de',
              p: 1,
            }}
          />

          <CardContent sx={{ p: '10px !important' }}>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Transactions</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>{transactions.length}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Pending</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>{pending}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Income</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>{Currency.intlFormat(income)}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Activity</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>{Currency.intlFormat(activity)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* <Box sx={{ width: '100%' }}>
        <Paper sx={{ p: 2, mx: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
            <Box>Pending Transactions</Box>
            <Box> {pendingTransactions}</Box>
          </Stack>
        </Paper>
      </Box> */}
    </Stack>
  )
}
