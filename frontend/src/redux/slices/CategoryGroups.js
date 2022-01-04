import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import { createSelectorCreator } from 'reselect';
import api from '../../api';
import { setCategories } from './Categories';

export const fetchCategories = createAsyncThunk('categories/fetch', async (_, { dispatch, getState }) => {
  const store = getState()
  const response = await api.fetchCategories(store.budgets.activeBudgetId);

  const categories = response.reduce((acc, group) => {
    return acc.concat(group.categories)
  }, []);

  dispatch(setCategories(categories))

  return response
})

export const createCategoryGroup = createAsyncThunk('categories/createCategoryGroup', async ({ name }, { getState }) => {
  const store = getState()
  return await api.createCategoryGroup(name, store.budgets.activeBudgetId);
})

export const updateCategoryGroup = createAsyncThunk('categories/updateCategoryGroup', async ({ id, name, order }, { getState }) => {
  const store = getState()
  return await api.updateCategoryGroup(id, name, order, store.budgets.activeBudgetId);
})

const categoryGroupsAdapter = createEntityAdapter()

const categoriesSlice = createSlice({
  name: 'categoryGroups',

  initialState: categoryGroupsAdapter.getInitialState(),

  reducers: {},

  extraReducers: builder => {
    builder
      .addCase(fetchCategories.fulfilled, (state, { payload }) => {
        categoryGroupsAdapter.setAll(state, payload)
      })
      .addCase(createCategoryGroup.fulfilled, (state, { payload }) => {
        categoryGroupsAdapter.addOne(state, payload)
      })
      .addCase(updateCategoryGroup.fulfilled, (state, { payload }) => {
        categoryGroupsAdapter.updateOne(state, payload)
      })
  },
})

export const categoryGroupsSelectors = categoryGroupsAdapter.getSelectors(state => state.categoryGroups)

export default categoriesSlice.reducer
