import { createSlice, createAsyncThunk, createEntityAdapter, createSelector } from '@reduxjs/toolkit';
import api from '../../api';

export const createCategory = createAsyncThunk('categories/createCategory', async ({ name, categoryGroupId }, { getState }) => {
  const store = getState()
  return await api.createCategory(name, categoryGroupId, store.budgets.activeBudgetId);
})

export const updateCategory = createAsyncThunk('categories/updateCategory', async ({ id, name, order, categoryGroupId }, { getState }) => {
  const store = getState()
  const category = await api.updateCategory(id, name, order, categoryGroupId, store.budgets.activeBudgetId);
  return category
})

const categoriesAdapter = createEntityAdapter()

const categoriesSlice = createSlice({
  name: 'categories',

  initialState: categoriesAdapter.getInitialState(),

  reducers: {
    setCategories: (state, { payload }) => {
      categoriesAdapter.setAll(state, payload)
    },
  },

  extraReducers: builder => {
    builder.addCase(createCategory.fulfilled, (state, { payload }) => {
      categoriesAdapter.addOne(state, payload)
    })

    builder.addCase(updateCategory.fulfilled, (state, { payload }) => {
      console.log(payload)
      categoriesAdapter.upsertOne(state, payload)
    })
  },
})

export const { setCategories } = categoriesSlice.actions

export const categoriesSelectors = categoriesAdapter.getSelectors(state => state.categories)
export const selectCategoryToGroupMap = createSelector(categoriesSelectors.selectAll, categories => categories.reduce((all, cat) => {
  all[cat.id] = cat
  return all
}, {}))

export default categoriesSlice.reducer
