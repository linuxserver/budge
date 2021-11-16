import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';
import { formatMonthFromDateString } from '../../utils/Date';

export const createBudget = createAsyncThunk('budgets/create', async ({ name }) => {
  return await api.createBudget(name);
})

export const fetchBudgets = createAsyncThunk('budgets/fetch', async () => {
  return await api.fetchBudgets();
})

export const fetchBudgetMonth = createAsyncThunk('budgets/fetchMonth', async ({ month }, { getState }) => {
  const store = getState()
  return {
    month,
    budgetMonth: await api.fetchBudgetMonth(store.budgets.activeBudget.id, month),
  }
})

export const fetchBudgetMonths = createAsyncThunk('budgets/fetchMonths', async (_, { getState }) => {
  const store = getState()
  return await api.fetchBudgetMonths(store.budgets.activeBudget.id)
})

export const updateCategoryMonth = createAsyncThunk('budgets/updateCategoryMonth', async({ categoryId, month, budgeted }, { getState }) => {
  const store = getState()
  return {
    month,
    budgetMonth: await api.updateCategoryMonth(store.budgets.activeBudget.id, categoryId, month, budgeted),
  }
})

const budgetsSlice = createSlice({
  name: 'budgets',

  initialState: {
    budgets: [],
    activeBudget: null,
    currentMonth: formatMonthFromDateString(new Date()),
    budgetMonths: {},
  },

  reducers: {
    setActiveBudget: (state, action) => {
      state.activeBudget = action.payload
    },

    setCurrentMonth: (state, { payload }) => {
      state.currentMonth = formatMonthFromDateString(payload)
    },
  },

  extraReducers: {
    [createBudget.fulfilled]: (state, action) => {
      state.budgets = state.budgets.push(action.payload)
    },

    [fetchBudgets.fulfilled]: (state, action) => {
      state.budgets = action.payload
    },

    [fetchBudgetMonth.fulfilled]: (state, { payload: { month, budgetMonth } }) => {
      state.budgetMonths[month] = budgetMonth
    },

    [fetchBudgetMonths.fulfilled]: (state, { payload: { month, budgetMonth } }) => {
      // state.budgetMonths[month] = budgetMonth
    },

    [updateCategoryMonth.fulfilled]: (state, { payload: { month, budgetMonth } }) => {
      state.budgetMonths[month] = budgetMonth
    },
  },
})

export const { setActiveBudget } = budgetsSlice.actions

export default budgetsSlice
