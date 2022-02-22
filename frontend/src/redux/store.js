import { configureStore } from '@reduxjs/toolkit'
import { reducers } from './slices'

export const store = configureStore({
  reducer: reducers,
  devTools: process.env.NODE_ENV !== 'production',
  // preloadedState: initialState,
})
