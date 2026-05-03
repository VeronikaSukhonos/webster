import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { ProjectResponse, TemplateResponse } from '@mytypes/responseTypes';

import type { RootState } from './store';

interface Modal {
  type:
    | 'updateAvatar'
    | 'createProject'
    | 'createTemplate'
    | 'projectSettings'
    | 'templateSettings'
    | 'deleteProject'
    | 'deleteTemplate'
    | 'exportProject';
  project?: Omit<ProjectResponse, 'file'>;
  template?: Omit<TemplateResponse, 'file'>;
}

interface UiState {
  isAvatarLoading: boolean;
  modal: Modal | null;
}

const initialState: UiState = {
  isAvatarLoading: false,
  modal: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setIsAvatarLoading: (state, action: PayloadAction<boolean>) => {
      state.isAvatarLoading = action.payload;
    },
    setModal: (state, action: PayloadAction<Modal | null>) => {
      state.modal = action.payload ?? null;
    },
  },
});

export const { setIsAvatarLoading, setModal } = uiSlice.actions;

export const selectUi = {
  isAvatarLoading: (state: RootState) => state.ui.isAvatarLoading,
  modal: (state: RootState) => state.ui.modal,
};

export default uiSlice.reducer;
