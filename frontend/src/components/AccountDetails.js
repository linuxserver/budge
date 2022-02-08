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

        <Paper sx={{ p: 2 }}>
          <Typography
            sx={{
              fontSize: theme.typography.h5.fontSize,
            }}
          >
            Summary
          </Typography>

          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Stack direction="column" justifyContent="space-between" alignItems="flex-start" spacing={4}>
              <Box>Cleared</Box>
              <Box>Uncleared ({pendingTransactions})</Box>
              <Box>Balance</Box>
            </Stack>

            <Stack direction="column" justifyContent="space-around" alignItems="center">
              <Typography
                style={{
                  color: getBalanceColor(account.cleared, theme),
                  fontWeight: 'bold',
                }}
                variant="h6"
              >
                {intlFormat(account.cleared)}
              </Typography>

              <Box>+</Box>

              <Typography
                style={{
                  color: getBalanceColor(account.cleared, theme),
                  fontWeight: 'bold',
                }}
                variant="h6"
              >
                {intlFormat(account.uncleared)}
              </Typography>

              <Box>=</Box>

              <Typography
                style={{
                  color: getBalanceColor(account.cleared, theme),
                  fontWeight: 'bold',
                }}
                variant="h6"
              >
                {intlFormat(account.balance)}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}
