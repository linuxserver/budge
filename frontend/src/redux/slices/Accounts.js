import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const createAccount = createAsyncThunk('accounts/create', async ({ name, accountType, budgetId }) => {
  return await api.createAccount(name, accountType, budgetId);
})

export const fetchAccounts = createAsyncThunk('accounts/fetch', async ({ budgetId }) => {
  return await api.fetchAcounts(budgetId);
})

const accountsSlice = createSlice({
  name: 'accounts',

  initialState: {
    accounts: [],
    accountById: {},
  },

  reducers: {
    setAccounts: (state, { payload }) => {
      state.accounts = payload

      // Map all accounts to make lookups faster
      payload.map(account => {
        accountsSlice.caseReducers.mapIdToAccount(state, { payload: { accountId: account.id, account } })
      })
    },

    mapIdToAccount: (state, { payload: { accountId, account }}) => {
      state.accountById[accountId] = account
    },
  },

  extraReducers: {
    [createAccount.fulfilled]: (state, { payload }) => {
      state.accounts.push(payload)
      state.accountById[payload.id] = payload
    },

    [fetchAccounts.fulfilled]: (state, { payload }) => {
      state.accounts = payload
    },
  },
})

export const { setAccounts, mapIdToAccount } = accountsSlice.actions

export default accountsSlice
