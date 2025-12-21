import { configureStore } from '@reduxjs/toolkit';
import { docApi } from './services/api';

export const store = configureStore({
  reducer: {
    [docApi.reducerPath]: docApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(docApi.middleware),
});