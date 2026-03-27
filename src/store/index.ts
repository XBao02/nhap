import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './uiSlice';
import authReducer from './authSlice'; // mới thêm

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer, // thêm auth vào store
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export * from './uiSlice';
export * from './authSlice';
