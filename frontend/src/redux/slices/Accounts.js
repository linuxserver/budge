import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit'
import api from '../../api'

export const createAccount = createAsyncThunk(
  'accounts/create',
  async ({ name, accountType, balance, date }, { getState, dispatch }) => {
    const store = getState()
    const account = await api.createAccount(name, accountType, balance, date, store.budgets.activeBudgetId)

    dispatch(fetchAccountTransactions({ accountId: account.id }))

    return account
  },
)

export const editAccount = createAsyncThunk('accounts/edit', async ({ id, name, order, balance }, { getState }) => {
  const store = getState()
  return await api.updateAccount(id, name, order, balance, store.budgets.activeBudgetId)
})

export const fetchAccounts = createAsyncThunk('accounts/fetch', async (_, { getState }) => {
  const store = getState()
  return await api.fetchAccounts(store.budgets.activeBudgetId)
})

export const fetchAccountTransactions = createAsyncThunk(
  'transactions/fetchAccountTransactions',
  async ({ accountId }, { getState }) => {
    const state = getState()
    return {
      accountId,
      transactions: await api.fetchAccountTransactions(accountId, state.budgets.activeBudgetId),
    }
  },
)

export const createTransaction = createAsyncThunk(
  'transactions/createTransaction',
  async ({ transaction }, { getState }) => {
    const state = getState()
    const response = await api.createTransaction(transaction, state.budgets.activeBudgetId)

    return {
      accountId: response.accountId,
      transaction: {
        ...response,
      },
    }
  },
)

export const createTransactions = createAsyncThunk(
  'transactions/createTransactions',
  async ({ transactions }, { getState }) => {
    const state = getState()
    const response = await api.createTransactions(transactions, state.budgets.activeBudgetId)

    return {
      accountId: response.accountId,
      transactions: response,
    }
  },
)

export const updateTransaction = createAsyncThunk(
  'transactions/updateTransaction',
  async ({ transaction }, { getState }) => {
    const state = getState()
    const response = await api.updateTransaction(transaction, state.budgets.activeBudgetId)

    return {
      accountId: response.accountId,
      transaction: response,
    }
  },
)

export const updateTransactions = createAsyncThunk(
  'transactions/updateTransactions',
  async ({ accountId, transactions }, { getState }) => {
    const state = getState()
    const response = await api.updateTransactions(transactions, state.budgets.activeBudgetId)

    return {
      accountId,
      transactions: response,
    }
  },
)

export const deleteTransaction = createAsyncThunk(
  'transactions/deleteTransaction',
  async ({ transaction }, { getState }) => {
    const state = getState()
    await api.deleteTransaction(transaction.id, state.budgets.activeBudgetId)

    return {
      transactionId: transaction.id,
      accountId: transaction.accountId,
    }
  },
)

export const deleteTransactions = createAsyncThunk(
  'transactions/deleteTransactions',
  async ({ transactions, accountId }, { getState }) => {
    const state = getState()
    const transactionIds = transactions.map(transaction => transaction.id)
    await api.deleteTransactions(transactionIds, state.budgets.activeBudgetId)

    return {
      transactionIds,
      accountId,
    }
  },
)

export const accountsAdapter = createEntityAdapter({
  sortComparer: (a, b) => (a.order < b.order ? -1 : 1),
})

export const transactionsAdapter = createEntityAdapter()

const accountsSlice = createSlice({
  name: 'accounts',

  initialState: accountsAdapter.getInitialState({
    editingRow: 0,
  }),

  reducers: {
    setAccounts: (state, { payload }) => {
      accountsAdapter.setAll(
        state,
        payload.map(account => ({
          ...account,
          transactions: transactionsAdapter.getInitialState(),
        })),
      )
    },

    setEditingRow: (state, { payload }) => {
      state.editingRow = payload
    },
  },

  extraReducers: builder => {
    builder
      .addCase(createAccount.fulfilled, (state, { payload }) => {
        accountsAdapter.addOne(state, {
          ...payload,
          transactions: transactionsAdapter.getInitialState(),
        })
      })
      .addCase(editAccount.fulfilled, (state, { payload }) => {
        accountsAdapter.upsertOne(state, {
          ...state.entities[payload.id],
          ...payload,
        })
      })
      .addCase(fetchAccounts.fulfilled, (state, { payload }) => {
        const accounts = payload.map(account => ({
          ...account,
          transactions: state.entities[account.id]
            ? state.entities[account.id].transactions
            : transactionsAdapter.getInitialState(),
        }))
        accountsAdapter.upsertMany(state, accounts)
      })
      .addCase(fetchAccountTransactions.fulfilled, (state, { payload: { accountId, transactions } }) => {
        const accountEntry = state.entities[accountId]
        if (accountEntry) {
          transactionsAdapter.setAll(accountEntry.transactions, transactions)
        }
      })
      .addCase(createTransaction.fulfilled, (state, { payload: { accountId, transaction } }) => {
        const accountEntry = state.entities[accountId]
        if (accountEntry) {
          transactionsAdapter.addOne(accountEntry.transactions, transaction)
        }
      })
      .addCase(createTransactions.fulfilled, (state, { payload: { accountId, transactions } }) => {
        const accountEntry = state.entities[accountId]
        if (accountEntry) {
          transactionsAdapter.upsertMany(accountEntry.transactions, transactions)
        }
      })
      .addCase(updateTransaction.fulfilled, (state, { payload: { accountId, transaction } }) => {
        const accountEntry = state.entities[accountId]
        if (accountEntry) {
          transactionsAdapter.setOne(accountEntry.transactions, transaction)
        }
      })
      .addCase(updateTransactions.fulfilled, (state, { payload: { accountId, transactions } }) => {
        const accountEntry = state.entities[accountId]
        if (accountEntry) {
          transactionsAdapter.upsertMany(accountEntry.transactions, transactions)
        }
      })
      .addCase(deleteTransaction.fulfilled, (state, { payload: { transactionId, accountId } }) => {
        const accountEntry = state.entities[accountId]
        if (accountEntry) {
          transactionsAdapter.removeOne(accountEntry.transactions, transactionId)
        }
      })
      .addCase(deleteTransactions.fulfilled, (state, { payload: { transactionIds, accountId } }) => {
        const accountEntry = state.entities[accountId]
        if (accountEntry) {
          transactionsAdapter.removeMany(accountEntry.transactions, transactionIds)
        }
      })
  },
})

export const { setAccounts, mapIdToAccount, setEditingRow } = accountsSlice.actions

export const accountsSelectors = accountsAdapter.getSelectors(state => state.accounts)
export const transactionsSelectors = transactionsAdapter.getSelectors(state => state.transactions)

export default accountsSlice.reducer
