import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux"
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover'
import Box from '@mui/material/Box';
import {
  bindPopover,
} from 'material-ui-popup-state/hooks'
import Stack from '@mui/material/Stack';
import { toUnit } from "dinero.js";
import Typography from '@mui/material/Typography';
import { inputToDinero, intlFormat } from "../utils/Currency";
import ButtonGroup from '@mui/material/ButtonGroup';
import { editAccount, fetchAccountTransactions } from "../redux/slices/Accounts";

export default function ReconcileForm(props) {
  /**
   * Redux block
   */
  const dispatch = useDispatch()

  const [balanceCorrectAnswer, setBalanceCorrectAnswer] = useState(null)
  const [balance, setBalance] = useState(toUnit(props.balance))

  useEffect(() => {
    setBalance(toUnit(props.balance))
  }, [props.balance]);

  const close = () => {
    props.popupState.close()
    setBalance(null)
    setBalanceCorrectAnswer(null)
  }

  const submit = async () => {
    await dispatch(editAccount({
      id: props.accountId,
      balance: inputToDinero(balance),
    }))
    await dispatch(fetchAccountTransactions({ accountId: props.accountId }))
    close()
  }

  return (
    <Popover
      id="reconcile-popover"
      {...bindPopover(props.popupState)}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      BackdropProps={{ onClick: close }}
    >
      <Box sx={{ p: 2 }}>
      {
        balanceCorrectAnswer === null && (
          <Stack direction="column" spacing={0.5} justifyContent="center"
          alignItems="center">
            <Typography>
              Is your current account balance
            </Typography>
            <Typography variant="h6">
              {intlFormat(props.balance)}?
            </Typography>
            <ButtonGroup variant="contained" aria-label="outlined primary button group">
              <Button size="small" onClick={submit}>Yes</Button>
              <Button size="small" onClick={() => setBalanceCorrectAnswer(false)}>No</Button>
            </ButtonGroup>
          </Stack>
        )
      }
      {
        balanceCorrectAnswer === false && (
          <>
            <TextField
              autoFocus
              fullWidth
              margin="dense"
              id="balance"
              value={balance}
              onChange={(event) =>
                setBalance(event.target.value)
              }
              label="Balance"
              type="text"
              variant="standard"
            />
            <Stack
              direction="row"
              justifyContent="flex-end"
              alignItems="center"
              spacing={2}
            >
              <Button onClick={submit} variant="contained">OK</Button>
            </Stack>
          </>
        )
      }
      </Box>
    </Popover>
  )
}
