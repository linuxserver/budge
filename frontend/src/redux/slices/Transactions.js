import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';
import { get } from 'lodash'

export const fetchAccountTransactions = createAsyncThunk('transactions/fetchAccountTransactions', async ({ accountId }, { getState }) => {
  const state = getState()
  return {
    accountId,
    transactions: (await api.fetchAccountTransactions(accountId, state.budgets.activeBudget.id)).map(transaction => ({
      ...transaction,
      inflow: transaction.amount > 0 ? transaction.amount : 0,
      outflow: transaction.amount < 0 ? transaction.amount * -1 : 0,
    }))
  };
})

export const createTransaction = createAsyncThunk('transactions/createTransaction', async ({ transaction }, { getState }) => {
  const state = getState()
  const response = await api.createTransaction(transaction, state.budgets.activeBudget.id)

  return {
    accountId: response.accountId,
    transaction: {
      ...response,
      inflow: transaction.amount > 0 ? transaction.amount : 0,
      outflow: transaction.amount < 0 ? transaction.amount * -1 : 0,
    },
  }
})

export const updateTransaction = createAsyncThunk('transactions/updateTransaction', async ({ transaction }, { getState }) => {
  const state = getState()
  const response = await api.updateTransaction(transaction, state.budgets.activeBudget.id)

  return {
    accountId: response.accountId,
    transaction: {
      ...response,
      inflow: transaction.amount > 0 ? transaction.amount : 0,
      outflow: transaction.amount < 0 ? transaction.amount * -1 : 0,
    },
  }
})

export const deleteTransaction = createAsyncThunk('transactions/deleteTransaction', async ({ transaction }, { getState }) => {
  const state = getState()
  const response = await api.deleteTransaction(transaction.id, state.budgets.activeBudget.id)

  return {
    transactionId: transaction.id,
    accountId: transaction.accountId,
  }
})

const transactionsSlice = createSlice({
  name: 'transactions',

  initialState: {
    transactions: {},
  },

  reducers: {},

  extraReducers: {
    [fetchAccountTransactions.fulfilled]: (state, { payload: { accountId, transactions }}) => {
      state.transactions[accountId] = transactions
    },

    [createTransaction.fulfilled]: (state, { payload: { accountId, transaction } }) => {
      if (!state.transactions[accountId]) {
        state.transactions[accountId] = []
      }

      state.transactions[accountId].push(transaction)
    },

    [updateTransaction.fulfilled]: (state, { payload: { accountId, transaction } }) => {
      state.transactions[accountId] = state.transactions[accountId].map(existingTransaction => {
        if (existingTransaction.id !== transaction.id) {
          return existingTransaction
        }

        return transaction
      })
    },

    [deleteTransaction.fulfilled]: (state, { payload: { transactionId, accountId } }) => {
      state.transactions[accountId] = state.transactions[accountId].filter(transaction => transaction.id !== transactionId)
    },
  },
})

export default transactionsSlice
