import { configureStore } from '@reduxjs/toolkit';

import authReducer from './authSlice';
import editorReducer from './editorSlice';
import uiReducer from './uiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    editor: editorReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
