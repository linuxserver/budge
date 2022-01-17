import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit'
import api from '../../api'
import { normalize, schema } from 'normalizr'

const categoryMonthEntity = new schema.Entity('categoryMonths')

const budgetMonthEntity = new schema.Entity('budgetMonths', {
  categories: [categoryMonthEntity],
})

export const fetchBudgetMonth = createAsyncThunk('budgetMonths/fetchMonth', async ({ month }, { getState }) => {
  const store = getState()
  const budgetMonth = await api.fetchBudgetMonth(store.budgets.activeBudgetId, month)
  const normalized = normalize(budgetMonth, budgetMonthEntity)
  return {
    month,
    entities: normalized.entities,
  }
})

export const refreshBudgetMonth = createAsyncThunk(
  'budgetMonths/refreshMonth',
  async ({ month, categoryId }, { getState }) => {
    const store = getState()
    const budgetMonth = await api.fetchBudgetMonth(store.budgets.activeBudgetId, month)
    // console.log(budgetMonth)
    // budgetMonth.categories = budgetMonth.categories.filter(categoryMonth => categoryMonth.categoryId === categoryId)
    const normalized = normalize(budgetMonth, budgetMonthEntity)
    return {
      month,
      entities: normalized.entities,
    }
  },
)

export const fetchBudgetMonths = createAsyncThunk('budgetMonths/fetchMonths', async ({ month }, { getState }) => {
  const store = getState()
  const budgetMonth = await api.fetchBudgetMonth(store.budgets.activeBudgetId, month)
  const normalized = normalize(budgetMonth, budgetMonthEntity)
  return {
    month,
    entities: normalized.entities,
  }
})

export const fetchCategoryMonths = createAsyncThunk(
  'budgetMonths/fetchCategoryMonths',
  async ({ categoryId, month = false }, { getState }) => {
    const store = getState()
    const categoryMonths = await api.fetchCategoryMonths(categoryId, month, store.budgets.activeBudgetId)

    return {
      categoryId,
      entities: normalize(categoryMonths, [categoryMonthEntity]).entities,
    }
  },
)

export const updateCategoryMonth = createAsyncThunk(
  'budgetMonths/updateCategoryMonth',
  async ({ categoryId, month, budgeted }, { getState }) => {
    const store = getState()
    const categoryMonth = await api.updateCategoryMonth(store.budgets.activeBudgetId, categoryId, month, budgeted)

    return {
      month,
      entities: normalize(categoryMonth, categoryMonthEntity).entities,
    }
  },
)

export const refreshBudgetCategory = createAsyncThunk(
  'budgetMonths/refreshBudgetCategory',
  async ({ month, categoryId }, { getState }) => {
    const store = getState()
    const categoryMonths = await api.fetchCategoryMonths(categoryId, month, store.budgets.activeBudgetId)
    const budgetMonth = await api.fetchBudgetMonth(store.budgets.activeBudgetId, month)

    // console.log(budgetMonth)
    // budgetMonth.categories = budgetMonth.categories.filter(categoryMonth => categoryMonth.categoryId === categoryId)

    const normalizedCategoryMonths = normalize(categoryMonths, [categoryMonthEntity])
    const normalizedBudgetMonth = normalize(budgetMonth, budgetMonthEntity)

    return {
      month,
      categoryId,
      entities: {
        budgetMonths: normalizedBudgetMonth.entities.budgetMonths,
        categoryMonths: {
          // ...normalizedBudgetMonth.entities.categories,
          ...normalizedCategoryMonths.entities.categoryMonths,
        },
      },
    }
  },
)

const budgetMonthsAdapter = createEntityAdapter({
  selectId: budgetMonth => budgetMonth.month,
  sortComparer: (a, b) => (a.month < b.month ? -1 : 1),
})

const budgetMonthsSlice = createSlice({
  name: 'budgetMonths',

  initialState: budgetMonthsAdapter.getInitialState(),

  reducers: {
    // setActiveBudget: (state, action) => {
    //   state.activeBudget = action.payload
    // },
    // setCurrentMonth: (state, { payload }) => {
    //   state.currentMonth = formatMonthFromDateString(payload)
    // },
  },

  extraReducers: builder => {
    builder
      .addCase(fetchBudgetMonth.fulfilled, (state, { payload: { month, entities } }) => {
        budgetMonthsAdapter.upsertMany(state, entities.budgetMonths)
      })
      .addCase(refreshBudgetMonth.fulfilled, (state, { payload: { month, entities } }) => {
        budgetMonthsAdapter.upsertMany(state, entities.budgetMonths)
      })
      .addCase(fetchBudgetMonths.fulfilled, (state, { payload: { month, entities } }) => {
        budgetMonthsAdapter.upsertMany(state, entities.budgetMonths)
      })
      .addCase(refreshBudgetCategory.fulfilled, (state, { payload: { month, entities } }) => {
        budgetMonthsAdapter.upsertMany(state, entities.budgetMonths)
      })
  },
})

export const categoryMonthsAdapter = createEntityAdapter({
  sortComparer: (a, b) => (a.month < b.month ? -1 : 1),
})

const categoryMonthsSlice = createSlice({
  name: 'categoryMonths',

  initialState: categoryMonthsAdapter.getInitialState(),

  reducers: {},

  extraReducers: builder => {
    builder
      .addCase(fetchBudgetMonth.fulfilled, (state, { payload: { entities } }) => {
        categoryMonthsAdapter.upsertMany(state, entities.categoryMonths)
      })
      .addCase(fetchCategoryMonths.fulfilled, (state, { payload: { entities } }) => {
        categoryMonthsAdapter.upsertMany(state, entities.categoryMonths)
      })
      .addCase(refreshBudgetCategory.fulfilled, (state, { payload: { month, entities } }) => {
        categoryMonthsAdapter.upsertMany(state, entities.categoryMonths)
      })
    // .addCase(refreshBudgetMonth.fulfilled, (state, { payload: { entities } }) => {
    //   console.log(entities)
    //   categoryMonthsAdapter.upsertMany(state, entities.categoryMonths)
    // })
  },
})

export const budgetMonthsSelectors = budgetMonthsAdapter.getSelectors(state => state.budgetMonths)
export const categoryMonthsSelectors = categoryMonthsAdapter.getSelectors(state => state.categoryMonths)

export const budgetMonths = budgetMonthsSlice.reducer
export const categoryMonths = categoryMonthsSlice.reducer
