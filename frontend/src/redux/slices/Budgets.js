import { createSlice, createAsyncThunk, createEntityAdapter, createSelector } from '@reduxjs/toolkit'
import api from '../../api'
import { formatMonthFromDateString } from '../../utils/Date'

export const createBudget = createAsyncThunk('budgets/create', async ({ name }) => {
  return await api.createBudget(name);
})

export const fetchBudgets = createAsyncThunk('budgets/fetchBudgets', async () => {
  return await api.fetchBudgets();
})

export const refreshBudget = createAsyncThunk('budgets/refreshBudget', async (_, { getState }) => {
  const store = getState()
  return await api.fetchBudget(store.budgets.activeBudgetId);
})

export const fetchAvailableMonths = createAsyncThunk('budgets/fetchMonths', async (_, { getState }) => {
  const store = getState()
  return await api.fetchBudgetMonths(store.budgets.activeBudgetId)
})

export const budgetsAdapter = createEntityAdapter()

const budgetsSlice = createSlice({
  name: 'budgets',

  initialState: budgetsAdapter.getInitialState({
    activeBudgetId: null,
    currentMonth: formatMonthFromDateString(new Date()),
    availableMonths: [],
  }),

  reducers: {
    setActiveBudget: (state, action) => {
      state.activeBudgetId = action.payload
    },

    setCurrentMonth: (state, { payload }) => {
      state.currentMonth = formatMonthFromDateString(payload)
    },
  },

  extraReducers: builder => {
    builder
      .addCase(createBudget.fulfilled, (state, { payload }) => {
        budgetsAdapter.setOne(state, payload)
      })
      .addCase(fetchBudgets.fulfilled, (state, { payload }) => {
        budgetsAdapter.setAll(state, payload.map(({ accounts, ...budget }) => budget))
      })
      .addCase(refreshBudget.fulfilled, (state, { payload: { accounts, ...budget } }) => {
        budgetsAdapter.upsertOne(state, budget)
      })
      .addCase(fetchAvailableMonths.fulfilled, (state, { payload }) => {
        state.availableMonths = payload.map(budgetMonth => budgetMonth.month).sort()
      })
  },
})

export const { setActiveBudget, setCurrentMonth } = budgetsSlice.actions

export const budgetSelectors = budgetsAdapter.getSelectors(state => state.budgets)
export const selectActiveBudget = createSelector([
  state => state.budgets.activeBudgetId,
  state => state.budgets.entities,
], (activeBudgetId, budgets) => budgets[activeBudgetId])

export default budgetsSlice.reducer
