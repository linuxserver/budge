import { createSlice, createAsyncThunk, createEntityAdapter, createSelector } from '@reduxjs/toolkit';
import api from '../../api';

export const createPayee = createAsyncThunk('payees/create', async ({ name, budgetId }) => {
  return await api.createPayee(name, budgetId);
})

export const fetchPayees = createAsyncThunk('payees/fetch', async (_, { getState }) => {
  const store = getState()
  return await api.fetchPayees(store.budgets.activeBudgetId)
})

const payeesAdapter = createEntityAdapter({
  // Assume IDs are stored in a field other than `book.id`
  // selectId: (payee) => payee.id,

  // Keep the "all IDs" array sorted based on book titles
  // sortComparer: (a, b) => a.title.localeCompare(b.title),
})

const payeesSlice = createSlice({
  name: 'payees',

  initialState: payeesAdapter.getInitialState(),

  reducers: {
    // setAccounts: (state, { payload }) => {
    //   state.accounts = payload

    //   // Map all accounts to make lookups faster
    //   payload.map(account => {
    //     payeesSlice.caseReducers.mapIdToAccount(state, { payload: { accountId: account.id, account } })
    //   })
    // },

    // mapIdToAccount: (state, { payload: { accountId, account }}) => {
    //   state.accountById[accountId] = account
    // },
  },

  extraReducers: (builder) => {
    builder
      .addCase(createPayee.fulfilled, (state, { payload }) => {
        payeesAdapter.addOne(state, payload)
      })
      .addCase(fetchPayees.fulfilled, (state, { payload }) => {
        payeesAdapter.setAll(state, payload)
      })
  }
})

// export const { setAccounts, mapIdToAccount } = payeesSlice.actions
export const payeesSelectors = payeesAdapter.getSelectors(state => state.payees)
export const selectPayeesMap = createSelector(payeesSelectors.selectAll, payees => Object.values(payees).reduce(
  (acc, payee) => {
    acc[payee.id] = payee.name
    return acc
  }, {}
))

export default payeesSlice.reducer
