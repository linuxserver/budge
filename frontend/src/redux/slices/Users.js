import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api'

export const login = createAsyncThunk('user/login', async ({ email, password }) => {
  return await api.login(email, password)
})

export const updateUser = createAsyncThunk('user/update', async ({ email, password, currentPassword }) => {
  return await api.updateUser(email, password, currentPassword)
})

const userSlice = createSlice({
  name: 'users',
  initialState: {
    user: {},
    initComplete: false,
  },
  reducers: {
    logout: state => {
      state = {
        user: {},
        initComplete: false,
      }
    },

    setUser: (state, action) => {
      state.user = action.payload
    },

    setInitComplete: (state, action) => {
      state.initComplete = action.payload
    },
  },
  extraReducers: {
    [login.fulfilled]: (state, action) => {
      state.user = action.payload
    },

    [updateUser.fulfilled]: (state, action) => {
      state.user = action.payload
    },

    [login.rejected]: state => {
      throw new Error()
    },
  },
})

export const { logout, setUser, setInitComplete } = userSlice.actions

export default userSlice.reducer
