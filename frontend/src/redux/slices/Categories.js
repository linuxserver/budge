import { createSlice, createAsyncThunk, createEntityAdapter, createSelector } from '@reduxjs/toolkit'
import api from '../../api'
import { setTransactions } from './Accounts'

export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async ({ name, categoryGroupId }, { getState }) => {
    const store = getState()
    return await api.createCategory(name, categoryGroupId, store.budgets.activeBudgetId)
  },
)

export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async ({ id, name, order, hidden, categoryGroupId }, { getState }) => {
    const store = getState()
    const category = await api.updateCategory(id, name, order, hidden, categoryGroupId, store.budgets.activeBudgetId)
    return category
  },
)

export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async ({ categoryId, newCategoryId }, { getState, dispatch }) => {
    const store = getState()
    const response = await api.deleteCategory(categoryId, newCategoryId, store.budgets.activeBudgetId)

    dispatch(setTransactions({ transactions: response.transactions }))
    // dispatch(setCategoryMonths({ categoryMonths: response.categoryMonths }))

    return response
  },
)

const categoriesAdapter = createEntityAdapter()

const categoriesSlice = createSlice({
  name: 'categories',

  initialState: categoriesAdapter.getInitialState({
    selected: null,
  }),

  reducers: {
    setCategories: (state, { payload }) => {
      categoriesAdapter.setAll(state, payload)
    },

    setSelectedCategory: (state, { payload }) => {
      state.selected = payload
    },
  },

  extraReducers: builder => {
    builder.addCase(createCategory.fulfilled, (state, { payload }) => {
      categoriesAdapter.addOne(state, payload)
    })

    builder.addCase(updateCategory.fulfilled, (state, { payload }) => {
      categoriesAdapter.upsertOne(state, payload)
    })

    builder.addCase(deleteCategory.fulfilled, (state, { payload }) => {
      return state
    })
  },
})

export const { setCategories, setSelectedCategory } = categoriesSlice.actions

export const categoriesSelectors = categoriesAdapter.getSelectors(state => state.categories)
export const selectCategoryToGroupMap = createSelector(categoriesSelectors.selectAll, categories =>
  categories.reduce((all, cat) => {
    all[cat.id] = cat
    return all
  }, {}),
)

export default categoriesSlice.reducer
