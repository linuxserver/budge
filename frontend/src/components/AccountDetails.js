import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import { useSelector, useDispatch } from 'react-redux'
import { getBalanceColor, FromAPI, inputToDinero, intlFormat, valueToDinero } from '../utils/Currency'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableRow from '@mui/material/TableRow'
import { useTheme } from '@mui/styles'
import Stack from '@mui/material/Stack'
import { isPositive, isZero } from 'dinero.js'
import Alert from '@mui/material/Alert'

import IconButton from '@mui/material/IconButton'
import { formatMonthFromDateString, getDateFromString } from '../utils/Date'
import BudgetMonthPicker from './BudgetMonthPicker'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import ExpandMore from '@mui/icons-material/ExpandMore'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import { selectActiveBudget, setCurrentMonth } from '../redux/slices/Budgets'

import { accountsSelectors, editAccount } from '../redux/slices/Accounts'
import TextField from '@mui/material/TextField'
import Popover from '@mui/material/Popover'
import { usePopupState, bindTrigger, bindPopover } from 'material-ui-popup-state/hooks'
import ReconcileForm from './ReconcileForm'
import { createSelector } from '@reduxjs/toolkit'

export default function BudgetDetails({ accountId, name }) {
  const theme = useTheme()
  const dispatch = useDispatch()

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

  const pendingTransactions = useSelector(
    state =>
      Object.values(state.accounts.entities[accountId].transactions.entities).filter(trx => trx.status === 0).length,
  )

  return (
    <Stack
      direction="column"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      sx={{ p: 3, height: '100%' }}
    >
      <Box sx={{ width: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pb: 4 }}>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 'bold', color: 'white', cursor: 'pointer', display: 'inline-block' }}
              {...bindTrigger(editAccountPopupState)}
            >
              {account.name}
            </Typography>
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

          <Box>
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
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box sx={{ color: 'white' }}>Pending Transactions</Box>
          <Box>
            <Typography
              style={{
                color: 'white',
                fontWeight: 'bold',
              }}
              variant="h6"
            >
              {pendingTransactions}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ py: 2 }}>
          <Divider />
        </Box>

        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box sx={{ color: 'white' }}>Cleared</Box>
          <Box>
            <Typography
              style={{
                color: getBalanceColor(account.cleared, theme),
                fontWeight: 'bold',
              }}
              variant="h6"
            >
              {intlFormat(account.cleared)}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
          <Box sx={{ color: 'white' }}>+</Box>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box sx={{ color: 'white' }}>Uncleared</Box>
          <Box>
            <Typography
              style={{
                color: getBalanceColor(account.cleared, theme),
                fontWeight: 'bold',
              }}
              variant="h6"
            >
              {intlFormat(account.uncleared)}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
          <Box sx={{ color: 'white' }}>=</Box>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box sx={{ color: 'white' }}>Balance</Box>
          <Box>
            <Typography
              style={{
                color: getBalanceColor(account.cleared, theme),
                fontWeight: 'bold',
              }}
              variant="h6"
            >
              {intlFormat(account.balance)}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Stack>
  )
}
