import React, { useState } from "react";
import { useDispatch, useSelector } from 'react-redux'
import { createPayee, fetchAccounts, fetchPayees, editAccount, createTransaction, deleteTransaction, updateTransaction } from "../../redux/slices/Accounts";
import TextField from '@mui/material/TextField';
import { inputToDinero, intlFormat } from '../../utils/Currency'
import { dinero, toUnit, isZero, isNegative, multiply } from "dinero.js";
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover'
import {
  usePopupState,
  bindTrigger,
  bindPopover,
} from 'material-ui-popup-state/hooks'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/styles'
import ReconcileForm from '../../components/ReconcileForm'

export default function BudgetTableHeader(props) {
  const theme = useTheme()
  const dispatch = useDispatch()

  const [accountName, setAccountName] = useState(props.account.name)

  const editAccountPopupState = usePopupState({
    variant: 'popover',
    popupId: 'editAccount',
  })

  const reconcilePopupState = usePopupState({
    variant: 'popover',
    popupId: 'reconcile-popup',
  })

  const editAccountName = (event) => {
    editAccountPopupState.close()
    dispatch(editAccount({ id: props.account.id, name: accountName }))
  }

  const getBalanceColor = (amount) => {
    if (isNegative(amount)) {
      return theme.palette.error.main
    }

    return theme.palette.success.main
  }

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={2}
      >
        <div>
          <h3 style={{cursor: 'pointer', display: 'inline-block'}} {...bindTrigger(editAccountPopupState)}>
            {props.account.name}
          </h3>
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
                onChange={(e) => setAccountName(e.target.value)}
              />
              <Stack
                direction="row"
                justifyContent="flex-end"
                alignItems="center"
                spacing={2}
              >
                <Button sx={{ p: 1 }} onClick={editAccountName}>Save</Button>
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
                color: getBalanceColor(props.account.cleared),
                fontWeight: "bold",
              }}
            >{intlFormat(props.account.cleared)}</Typography>
            <Typography variant="caption">Cleared</Typography>
          </Stack>
        </div>

        <div>+</div>

        <div>
          <Stack
            direction="column"
            justifyContent="center"
            alignItems="center"
            // spacing={2}
          >
            <Typography
              style={{
                color: getBalanceColor(props.account.uncleared),
                fontWeight: "bold",
              }}
            >{intlFormat(props.account.uncleared)}</Typography>
            <Typography variant="caption">Uncleared</Typography>
          </Stack>
        </div>

        <div>=</div>

        <div>
          <Stack
            direction="column"
            justifyContent="center"
            alignItems="center"
            // spacing={2}
          >
            <Typography
              style={{
                color: getBalanceColor(props.account.balance),
                fontWeight: "bold",
              }}
            >{intlFormat(props.account.balance)}</Typography>
            <Typography variant="caption">Working Balance</Typography>
          </Stack>
        </div>

        <div>
          <Button
            {...bindTrigger(reconcilePopupState)}
            variant="outlined"
            size="small"
          >
            <Typography style={{ fontSize: theme.typography.caption.fontSize, fontWeight: 'bold' }}>
              Reconcile
            </Typography>
          </Button>
          <ReconcileForm
            key={props.account.cleared}
            popupState={reconcilePopupState}
            accountId={props.account.id}
            balance={props.account.cleared}
          />
        </div>
      </Stack>
    </Box>
  )
}
