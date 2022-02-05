import { createSlice } from '@reduxjs/toolkit'

const appSlice = createSlice({
  name: 'app',

  initialState: {
    theme: 'light',
  },

  reducers: {
    setTheme: (state, { payload }) => {
      state.theme = payload
    },
  },
})

export const { setTheme } = appSlice.actions

export default appSlice.reducer
