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
  project?: Omit<ProjectResponse, 'content' | 'file' | 'images'>;
  template?: Omit<TemplateResponse, 'content' | 'file' | 'images'>;
}

interface UiState {
  isAvatarLoading: boolean;
  modal: Modal | null;
  projectToUpdate: number | null;
  projectToDuplicate: number | null;
  projectToDelete: number | null;
  templateToUpdate: number | null;
  templateToDelete: number | null;
}

const initialState: UiState = {
  isAvatarLoading: false,
  modal: null,
  projectToUpdate: null,
  projectToDuplicate: null,
  projectToDelete: null,
  templateToUpdate: null,
  templateToDelete: null,
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
    setProjectToUpdate: (state, action: PayloadAction<number | null>) => {
      state.projectToUpdate = action.payload ?? null;
    },
    setProjectToDuplicate: (state, action: PayloadAction<number | null>) => {
      state.projectToDuplicate = action.payload ?? null;
    },
    setProjectToDelete: (state, action: PayloadAction<number | null>) => {
      state.projectToDelete = action.payload ?? null;
    },
    setTemplateToUpdate: (state, action: PayloadAction<number | null>) => {
      state.templateToUpdate = action.payload ?? null;
    },
    setTemplateToDelete: (state, action: PayloadAction<number | null>) => {
      state.templateToDelete = action.payload ?? null;
    },
  },
});

export const {
  setIsAvatarLoading,
  setModal,
  setProjectToUpdate,
  setProjectToDuplicate,
  setProjectToDelete,
  setTemplateToUpdate,
  setTemplateToDelete,
} = uiSlice.actions;

export const selectUi = {
  isAvatarLoading: (state: RootState) => state.ui.isAvatarLoading,
  modal: (state: RootState) => state.ui.modal,
  projectToUpdate: (state: RootState) => state.ui.projectToUpdate,
  projectToDuplicate: (state: RootState) => state.ui.projectToDuplicate,
  projectToDelete: (state: RootState) => state.ui.projectToDelete,
  templateToUpdate: (state: RootState) => state.ui.templateToUpdate,
  templateToDelete: (state: RootState) => state.ui.templateToDelete,
};

export default uiSlice.reducer;
