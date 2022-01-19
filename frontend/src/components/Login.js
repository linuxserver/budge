import React, { useState, useEffect } from 'react'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { setUser, login, logout, setInitComplete } from '../redux/slices/Users'
import {
  createBudget,
  fetchAvailableMonths,
  fetchBudgets,
  setActiveBudget,
  setCurrentMonth,
} from '../redux/slices/Budgets'
import { setAccounts, fetchAccountTransactions } from '../redux/slices/Accounts'
import { fetchPayees } from '../redux/slices/Payees'
import { fetchCategories, createCategoryGroup } from '../redux/slices/CategoryGroups'
import { createCategory } from '../redux/slices/Categories'
import api from '../api'
import { useDispatch } from 'react-redux'
import AlertDialog from './AlertDialog'
import { formatMonthFromDateString } from '../utils/Date'

export default function Login(props) {
  /**
   * State block
   */
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)
  const [alertDialogBody, setAlertDialogBody] = useState('')

  const onEmailChange = e => setEmail(e.target.value)
  const onPasswordChange = e => setPassword(e.target.value)

  /**
   * Redux block
   */
  const dispatch = useDispatch()
  // const user = useState(state => state.users.user)

  useEffect(() => {
    onMount()
  }, [])

  const onMount = async () => {
    try {
      const response = await api.ping()
      dispatch(setUser(response))
      initUser()
    } catch (err) {
      dispatch(logout())
      setOpen(true)
    }
  }

  const initUser = async () => {
    const budgets = (await dispatch(fetchBudgets())).payload
    // @TODO: better way to set 'default' budget? Maybe a flag on the budget object
    await dispatch(setActiveBudget({ budgetId: budgets[0].id }))
    await dispatch(setCurrentMonth({ month: formatMonthFromDateString(new Date()) }))
    await dispatch(setAccounts(budgets[0].accounts))

    // @TODO: get all categories
    await dispatch(fetchCategories())

    // Fetch all account transactions
    await Promise.all(
      budgets[0].accounts.map(account => {
        return dispatch(
          fetchAccountTransactions({
            accountId: account.id,
          }),
        )
      }),
    )

    await dispatch(fetchPayees())
    await dispatch(fetchAvailableMonths())

    // done
    dispatch(setInitComplete(true))
  }

  const handleLogin = async () => {
    try {
      await dispatch(
        login({
          email,
          password,
        }),
      )

      await initUser()
    } catch (err) {
      setAlertDialogBody('Failed to log in')
      setAlertDialogOpen(true)
    }
  }

  const userCreation = async () => {
    await api.createUser(email, password)

    await dispatch(
      login({
        email,
        password,
      }),
    )
    // Create initial budget
    const newBudget = (await dispatch(createBudget({ name: 'My Budget' }))).payload
    await dispatch(setActiveBudget({ budgetId: newBudget.id }))

    // Create initial items such as category group, categories, etc.
    const newCategoryGroup = (
      await dispatch(
        createCategoryGroup({
          name: 'Expenses',
        }),
      )
    ).payload

    await Promise.all([
      dispatch(
        createCategory({
          categoryGroupId: newCategoryGroup.id,
          name: 'Rent',
        }),
      ),
      dispatch(
        createCategory({
          categoryGroupId: newCategoryGroup.id,
          name: 'Electric',
        }),
      ),
      dispatch(
        createCategory({
          categoryGroupId: newCategoryGroup.id,
          name: 'Water',
        }),
      ),
    ])

    await initUser()
  }

  return (
    <div>
      <AlertDialog open={alertDialogOpen} body={alertDialogBody} handleClose={() => setAlertDialogOpen(false)} />
      <Dialog open={open} disableEscapeKeyDown={true} onBackdropClick={() => false}>
        <DialogTitle>Login</DialogTitle>
        <DialogContent>
          <DialogContentText>Login to start budgeting!</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="email"
            label="Email Address"
            type="email"
            fullWidth
            variant="standard"
            onChange={onEmailChange}
          />
          <TextField
            margin="dense"
            id="password"
            label="Password"
            type="password"
            fullWidth
            variant="standard"
            onChange={onPasswordChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogin}>Login</Button>
          <Button onClick={userCreation}>Create Account</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
