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

export const updateCategoryGroup = createAsyncThunk('categories/updateCategoryGroup', async ({ id, name, order }, { getState }) => {
  const store = getState()
  return await api.updateCategoryGroup(id, name, order, store.budgets.activeBudget.id);
})

export const createCategory = createAsyncThunk('categories/createCategory', async ({ name, categoryGroupId }, { getState }) => {
  const store = getState()
  return await api.createCategory(name, categoryGroupId, store.budgets.activeBudget.id);
})

export const updateCategory = createAsyncThunk('categories/updateCategory', async ({ id, name, order ,categoryGroupId }, { getState }) => {
  const store = getState()
  return await api.updateCategory(id, name, order, categoryGroupId, store.budgets.activeBudget.id);
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

    [updateCategoryGroup.fulfilled]: (state, { payload }) => {
      const index = state.categoryGroups.findIndex(group => group.id === payload.id)
      state.categoryGroups[index] = payload
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

    [updateCategory.fulfilled]: (state, { payload }) => {
      const index = state.categories.findIndex(category => category.id === payload.id)
      const oldGroupIndex = state.categoryGroups.findIndex(group => group.categories.filter(cat => cat.id === payload.id).length === 1)

      // Update groups first if the group has changed
      if (state.categories[index].categoryGroupId !== payload.categoryGroupId) {
        // remove from old group
        state.categoryGroups[oldGroupIndex].categories = state.categoryGroups[oldGroupIndex].categories.filter(cat => cat.id !== payload.id)

        // add to new group
        const newGroupIndex = state.categoryGroups.findIndex(group => group.id === payload.categoryGroupId)
        state.categoryGroups[newGroupIndex].categories.push(payload)
      } else {
        state.categoryGroups[oldGroupIndex].categories = state.categoryGroups[oldGroupIndex].categories.map(cat => {
          if (cat.id === payload.id) {
            return payload
          }

          return cat
        })
      }

      state.categories[index] = payload
    },
  },
})

export default categoriesSlice
