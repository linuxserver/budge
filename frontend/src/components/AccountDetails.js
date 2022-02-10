import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import { useSelector, useDispatch } from 'react-redux'
import { getBalanceColor, FromAPI, intlFormat } from '../utils/Currency'
import { useTheme } from '@mui/styles'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import { accountsSelectors, editAccount } from '../redux/slices/Accounts'
import TextField from '@mui/material/TextField'
import Popover from '@mui/material/Popover'
import { usePopupState, bindTrigger, bindPopover } from 'material-ui-popup-state/hooks'
import ReconcileForm from './ReconcileForm'
import { createSelector } from '@reduxjs/toolkit'
import Paper from '@mui/material/Paper'
import BalanceCalculation from './AccountTable/BalanceCalculation'
import EditIcon from '@mui/icons-material/Edit'

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
      sx={{ px: 2, pb: 2, height: '100%' }}
    >
      <Box sx={{ width: '100%' }}>
        <Paper sx={{ p: 2, m: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pb: 2 }}>
            <Stack
              direction="row"
              justifyContent="flex-start"
              alignItems="center"
              {...bindTrigger(editAccountPopupState)}
              sx={{ width: '100%', pr: 2 }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 'bold', color: 'white', cursor: 'pointer', display: 'inline-block', pr: 2 }}
              >
                {account.name}
              </Typography>

              {/* <EditIcon sx={{ cursor: 'pointer' }} /> */}
            </Stack>

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

            <Box>
              <Button {...bindTrigger(reconcilePopupState)} color="primary" variant="outlined">
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

          <BalanceCalculation account={account} />

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mt: 1, pt: 1, borderTop: `1px solid ${theme.palette.action.disabled}` }}
          >
            <Box>Pending Transactions</Box>
            <Box> {pendingTransactions}</Box>
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}
