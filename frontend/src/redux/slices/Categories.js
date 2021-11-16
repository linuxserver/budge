import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const fetchCategories = createAsyncThunk('categories/fetch', async (_, { getState }) => {
  const store = getState()
  return await api.fetchCategories(store.budgets.activeBudget.id);
})

export const createCategoryGroup = createAsyncThunk('categories/createCategoryGroup', async ({ name }, { getState }) => {
  const store = getState()
  return await api.createCategoryGroup(name, store.budgets.activeBudget.id);
})

export const createCategory = createAsyncThunk('categories/createCategory', async ({ name, categoryGroupId }, { getState }) => {
  const store = getState()
  return await api.createCategory(name, categoryGroupId, store.budgets.activeBudget.id);
})

const categoriesSlice = createSlice({
  name: 'categories',

  initialState: {
    categoryGroups: [],
    categories: [],
    categoriesToGroups: {},
  },

  reducers: {},

  extraReducers: {
    [fetchCategories.fulfilled]: (state, { payload }) => {
      state.categoryGroups = payload
      state.categories = payload.reduce((acc, group) => {
        return acc.concat(group.categories.map(category => {
          state.categoriesToGroups[category.id] = category.categoryGroupId
          return { ...category }
        }))
      }, []);
    },

    [createCategoryGroup.fulfilled]: (state, { payload }) => {
      state.categoryGroups.push(payload)
    },

    [createCategory.fulfilled]: (state, { payload }) => {
      state.categories.push(payload)
      state.categoriesToGroups[payload.id] = payload.categoryGroupId
      state.categoryGroups = state.categoryGroups.map(group => {
        if (group.id !== payload.categoryGroupId) {
          return group
        }

        group.categories.push(payload)
        return group
      })
    },
  },
})

export default categoriesSlice
