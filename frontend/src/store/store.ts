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
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['ui/setModal'],
        ignoredActionPaths: ['payload.stageRef.current', 'payload.backgroundRef.current'],
        ignoredPaths: ['ui.modal.stageRef.current', 'ui.modal.backgroundRef.current'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
