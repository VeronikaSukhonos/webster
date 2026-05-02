import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { AuthUser } from '@mytypes/responseTypes';

import type { RootState } from './store';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser: (state, action: PayloadAction<{ user: AuthUser; accessToken: string } | null>) => {
      state.user = action.payload?.user ?? null;
      state.accessToken = action.payload?.accessToken ?? null;
    },
    updateAuthUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
  },
});

export const { setAuthUser, updateAuthUser } = authSlice.actions;

export const selectAuthUser = {
  user: (state: RootState) => state.auth.user,
  accessToken: (state: RootState) => state.auth.accessToken,
};

export default authSlice.reducer;
