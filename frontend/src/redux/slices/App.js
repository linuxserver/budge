import { createSlice } from '@reduxjs/toolkit'

const appSlice = createSlice({
  name: 'app',

  initialState: {
    theme: 'dark',
  },

  reducers: {
    setTheme: (state, { payload }) => {
      state.theme = payload
    },
  },
})

export const { setTheme } = appSlice.actions

export default appSlice.reducer
