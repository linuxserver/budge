import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { accountsSelectors, editAccount } from '../../redux/slices/Accounts'
import TextField from '@mui/material/TextField'
import { FromAPI, getBalanceColor, intlFormat } from '../../utils/Currency'
import Button from '@mui/material/Button'
import Popover from '@mui/material/Popover'
import { usePopupState, bindTrigger, bindPopover } from 'material-ui-popup-state/hooks'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/styles'
import ReconcileForm from '../../components/ReconcileForm'
import { createSelector } from '@reduxjs/toolkit'

export default function BudgetTableHeader({ accountId, name }) {
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

  console.log(theme)

  return (
    <Box sx={{ backgroundColor: theme.palette.background.header }} p={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ px: 2 }}>
        <Stack direction="row" justifyContent="flex-start" alignItems="center" spacing={2}>
          <div>
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
          </div>

          <div>
            <Stack
              direction="column"
              justifyContent="center"
              alignItems="center"
              // spacing={2}
            >
              <Typography
                style={{
                  color: getBalanceColor(account.cleared, theme),
                  fontWeight: 'bold',
                }}
                variant="h6"
              >
                {intlFormat(account.cleared)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 'bold',
                  color: theme.palette.grey[200],
                }}
              >
                Cleared
              </Typography>
            </Stack>
          </div>

          <Box
            sx={{
              ...theme.typography.h6,
              color: theme.palette.grey[200],
            }}
          >
            +
          </Box>

          <div>
            <Stack
              direction="column"
              justifyContent="center"
              alignItems="center"
              // spacing={2}
            >
              <Typography
                style={{
                  color: getBalanceColor(account.uncleared, theme),
                  fontWeight: 'bold',
                }}
                variant="h6"
              >
                {intlFormat(account.uncleared)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 'bold',
                  color: theme.palette.grey[200],
                }}
              >
                Uncleared
              </Typography>
            </Stack>
          </div>

          <Box
            sx={{
              ...theme.typography.h6,
              color: theme.palette.grey[200],
            }}
          >
            =
          </Box>

          <div>
            <Stack
              direction="column"
              justifyContent="center"
              alignItems="center"
              // spacing={2}
            >
              <Typography
                style={{
                  color: getBalanceColor(account.balance, theme),
                  fontWeight: 'bold',
                }}
                variant="h6"
              >
                {intlFormat(account.balance)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 'bold',
                  color: theme.palette.grey[200],
                }}
              >
                Working Balance
              </Typography>
            </Stack>
          </div>
        </Stack>

        <div>
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
        </div>
      </Stack>
    </Box>
  )
}
