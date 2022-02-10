import { createSlice } from '@reduxjs/toolkit'

const appSlice = createSlice({
  name: 'app',

  initialState: {
    theme: localStorage.getItem('theme') || 'dark',
  },

  reducers: {
    setTheme: (state, { payload }) => {
      localStorage.setItem('theme', payload)
      state.theme = payload
    },
  },
})

export const { setTheme } = appSlice.actions

export default appSlice.reducer
