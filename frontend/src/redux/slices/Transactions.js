import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import api from '../../api';
import { get } from 'lodash'
import { batch } from 'react-redux'

export const fetchAccountTransactions = createAsyncThunk('transactions/fetchAccountTransactions', async ({ accountId }, { getState }) => {
  const state = getState()
  return {
    accountId,
    transactions: await api.fetchAccountTransactions(accountId, state.budgets.activeBudgetId)
  };
})

export const createTransaction = createAsyncThunk('transactions/createTransaction', async ({ transaction }, { getState }) => {
  const state = getState()
  const response = await api.createTransaction(transaction, state.budgets.activeBudgetId)

  return {
    accountId: response.accountId,
    transaction: {
      ...response,
    },
  }
})

export const updateTransaction = createAsyncThunk('transactions/updateTransaction', async ({ transaction }, { getState }) => {
  const state = getState()
  const response = await api.updateTransaction(transaction, state.budgets.activeBudgetId)

  return {
    accountId: response.accountId,
    transaction: {
      ...response,
    },
  }
})

export const deleteTransaction = createAsyncThunk('transactions/deleteTransaction', async ({ transaction }, { getState }) => {
  const state = getState()
  const response = await api.deleteTransaction(transaction.id, state.budgets.activeBudgetId)

  return {
    transactionId: transaction.id,
    accountId: transaction.accountId,
  }
})

export const transactionsAdapter = createEntityAdapter({
  // Assume IDs are stored in a field other than `book.id`
  // selectId: (payee) => payee.id,

  // Keep the "all IDs" array sorted based on book titles
  // sortComparer: (a, b) => a.title.localeCompare(b.title),
})

const transactionsSlice = createSlice({
  name: 'transactions',

  initialState: transactionsAdapter.getInitialState(),

  reducers: {},

  extraReducers: {
    [fetchAccountTransactions.fulfilled]: (state, { payload: { accountId, transactions }}) => {
      const accountEntry = state.entities[accountId];
      if (accountEntry) {
        transactionsAdapter.setAll(accountEntry.transactions, transactions);
      }
    },

    [createTransaction.fulfilled]: (state, { payload: { accountId, transaction } }) => {
      const accountEntry = state.entities[accountId];
      if (accountEntry) {
        transactionsAdapter.addOne(accountEntry.transactions, transaction);
      }
    },

    [updateTransaction.fulfilled]: (state, { payload: { accountId, transaction } }) => {
      const accountEntry = state.entities[accountId];
      if (accountEntry) {
        transactionsAdapter.updateOne(accountEntry.transactions, transaction);
      }
    },

    [updateTransaction.rejected]: (state) => {
      throw new Error
    },

    [deleteTransaction.fulfilled]: (state, { payload: { transactionId, accountId } }) => {
      const accountEntry = state.entities[accountId];
      if (accountEntry) {
        transactionsAdapter.removeOne(accountEntry.transactions, transactionId)
      }
    },
  },
})

export const transactionsSelectors = transactionsAdapter.getSelectors(state => state.transactions)

export default transactionsSlice.reducer
