import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';
import { formatMonthFromDateString } from '../../utils/Date';

export const createBudget = createAsyncThunk('budgets/create', async ({ name }) => {
  return await api.createBudget(name);
})

export const fetchBudgets = createAsyncThunk('budgets/fetchBudgets', async () => {
  return await api.fetchBudgets();
})

export const refreshBudget = createAsyncThunk('budgets/refreshBudget', async (_, { getState }) => {
  const store = getState()
  return await api.fetchBudget(store.budgets.activeBudget.id);
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

export const fetchCategoryMonths = createAsyncThunk('budgets/fetchCategoryMonths', async ({ categoryId }, { getState }) => {
  const store = getState()
  return {
    categoryId,
    categoryMonths: await api.fetchCategoryMonths(categoryId, store.budgets.activeBudget.id)
  }
})

export const updateCategoryMonth = createAsyncThunk('budgets/updateCategoryMonth', async({ categoryId, month, budgeted }, { getState }) => {
  const store = getState()
  return {
    month,
    categoryMonth: await api.updateCategoryMonth(store.budgets.activeBudget.id, categoryId, month, budgeted),
  }
})

const budgetsSlice = createSlice({
  name: 'budgets',

  initialState: {
    budgets: [],
    activeBudget: null,
    currentMonth: formatMonthFromDateString(new Date()),
    availableMonths: [],
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
    [createBudget.fulfilled]: (state, { payload }) => {
      state.budgets = state.budgets.push(payload)
    },

    [fetchBudgets.fulfilled]: (state, action) => {
      state.budgets = action.payload
    },

    [refreshBudget.fulfilled]: (state, { payload }) => {
      state.activeBudget = payload
    },

    [fetchBudgetMonth.fulfilled]: (state, { payload: { month, budgetMonth } }) => {
      state.budgetMonths[month] = budgetMonth
    },

    [fetchBudgetMonths.fulfilled]: (state, { payload }) => {
      state.availableMonths = payload.map(budgetMonth => budgetMonth.month).sort()
    },

    [fetchCategoryMonths.fulfilled]: (state, { payload: { categoryId, categoryMonths } }) => {
      for (const categoryMonth of categoryMonths) {
        if (!state.budgetMonths[categoryMonth.month]) {
          // Haven't fetched this month yet, so no need to udpate
          continue
        }

        const categoryMonthIndex = state.budgetMonths[categoryMonth.month].categories.findIndex(catMonth => catMonth.categoryId === categoryId)
        if (categoryMonthIndex === -1) {
          // This is a new category month, so append
          state.budgetMonths[categoryMonth.month].categories.push(categoryMonth)
        } else {
          state.budgetMonths[categoryMonth.month].categories[categoryMonthIndex] = categoryMonth
        }
      }
    },

    [updateCategoryMonth.fulfilled]: (state, { payload: { month, categoryMonth } }) => {
      state.budgetMonths[month].categories = state.budgetMonths[month].categories.map(catMonth => {
        if (catMonth.categoryId !== categoryMonth.categoryId) {
          return catMonth
        }

        return categoryMonth
      })
    },
  },
})

export const { setActiveBudget, setCurrentMonth } = budgetsSlice.actions

export default budgetsSlice
