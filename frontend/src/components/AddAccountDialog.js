import React, { useState } from 'react'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { createAccount, fetchAccounts } from '../redux/slices/Accounts'
import { useDispatch, useSelector } from 'react-redux'
import MenuItem from '@mui/material/MenuItem'
import { fetchCategories } from '../redux/slices/CategoryGroups'
import { refreshBudget } from '../redux/slices/Budgets'
import { inputToDinero } from '../utils/Currency'
import { fetchPayees } from '../redux/slices/Payees'

const accountTypes = ['Bank', 'Credit Card', 'Off Budget Account']

export default function AddAccountDialog(props) {
  const month = useSelector(state => state.budgets.currentMonth)

  /**
   * State block
   */
  const [name, setName] = useState('')
  const [accountType, setAccountType] = useState('')
  const [balance, setBalance] = useState(0)
  const onNameChange = e => setName(e.target.value)
  const onAccountTypeChange = e => setAccountType(e.target.value)
  const onBalanceChange = e => setBalance(e.target.value)

  /**
   * Redux block
   */
  const dispatch = useDispatch()

  const handleCreateAccount = async () => {
    await dispatch(
      createAccount({
        name,
        accountType,
        balance: inputToDinero(balance),
        date: new Date(),
      }),
    )

    dispatch(refreshBudget())
    dispatch(fetchAccounts())
    dispatch(fetchPayees())

    // If adding a credit card, update all categories since we have added a payment category for it
    if (accountType === 1) {
      dispatch(fetchCategories())
    }
    reset()
    props.close()
  }

  const reset = () => {
    setName('')
    setAccountType('')
  }

  return (
    <div>
      <Dialog open={props.isOpen} disableEscapeKeyDown={true} onBackdropClick={() => false}>
        <DialogTitle>Add an Account</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Account name"
            type="text"
            fullWidth
            variant="standard"
            onChange={onNameChange}
          />
          <TextField
            select
            fullWidth
            variant="standard"
            label="Account Type"
            value={accountType}
            onChange={onAccountTypeChange}
            helperText="Please select the account type"
          >
            {accountTypes.map((type, index) => (
              <MenuItem key={index} value={index}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            id="balance"
            label="Initial balance"
            type="number"
            fullWidth
            variant="standard"
            onChange={onBalanceChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateAccount}>Create Account</Button>
          <Button onClick={props.close}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
