import { createSlice, createAsyncThunk, createEntityAdapter, createSelector } from '@reduxjs/toolkit'
import api from '../../api'
import { formatMonthFromDateString } from '../../utils/Date'
import { fetchBudgetMonth } from './BudgetMonths'
import { Currency } from '../../utils/Currency'

export const createBudget = createAsyncThunk('budgets/create', async ({ name }) => {
  return await api.createBudget(name)
})

export const updateBudget = createAsyncThunk('budgets/update', async ({ name, currency }, { getState }) => {
  const store = getState()
  return await api.updateBudget(store.budgets.activeBudgetId, name, currency)
})

export const fetchBudgets = createAsyncThunk('budgets/fetchBudgets', async () => {
  return await api.fetchBudgets()
})

export const refreshBudget = createAsyncThunk('budgets/refreshBudget', async (_, { getState }) => {
  const store = getState()
  return await api.fetchBudget(store.budgets.activeBudgetId)
})

export const fetchAvailableMonths = createAsyncThunk('budgets/fetchMonths', async (_, { getState }) => {
  const store = getState()
  return await api.fetchBudgetMonths(store.budgets.activeBudgetId)
})

export const setActiveBudget = createAsyncThunk('budgets/setActiveBudget', async ({ budgetId }) => {
  await api.fetchBudget(budgetId)
  return budgetId
})

export const setCurrentMonth = createAsyncThunk('budgets/setCurrentMonth', async ({ month }, { dispatch }) => {
  dispatch(fetchBudgetMonth({ month }))
  return month
})

export const budgetsAdapter = createEntityAdapter()

const budgetsSlice = createSlice({
  name: 'budgets',

  initialState: budgetsAdapter.getInitialState({
    activeBudgetId: null,
    currentMonth: formatMonthFromDateString(new Date()),
    availableMonths: [],
  }),

  reducers: {},

  extraReducers: builder => {
    builder
      .addCase(createBudget.fulfilled, (state, { payload }) => {
        budgetsAdapter.setOne(state, payload)
      })
      .addCase(updateBudget.fulfilled, (state, { payload }) => {
        budgetsAdapter.upsertOne(state, payload)
      })
      .addCase(fetchBudgets.fulfilled, (state, { payload }) => {
        budgetsAdapter.setAll(
          state,
          payload.map(({ accounts, ...budget }) => budget),
        )
      })
      .addCase(refreshBudget.fulfilled, (state, { payload: { accounts, ...budget } }) => {
        budgetsAdapter.upsertOne(state, budget)
      })
      .addCase(fetchAvailableMonths.fulfilled, (state, { payload }) => {
        state.availableMonths = payload.map(budgetMonth => budgetMonth.month).sort()
      })
      .addCase(setActiveBudget.fulfilled, (state, { payload }) => {
        state.activeBudgetId = payload
        Currency.setCurrency(state.entities[payload].currency)
      })
      .addCase(setCurrentMonth.fulfilled, (state, { payload }) => {
        state.currentMonth = payload
      })
  },
})

export const budgetSelectors = budgetsAdapter.getSelectors(state => state.budgets)
export const selectActiveBudget = createSelector(
  [state => state.budgets.activeBudgetId, state => state.budgets.entities],
  (activeBudgetId, budgets) => budgets[activeBudgetId],
)

export default budgetsSlice.reducer
