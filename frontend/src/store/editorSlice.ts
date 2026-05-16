import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_CANVAS_SIZE } from '@utils/constants';
import { initCanvas } from '@utils/editorUtils';

import { type Background, type Canvas } from '@mytypes/editorTypes';
import type { ProjectResponse, TemplateResponse } from '@mytypes/responseTypes';

import type { RootState } from './store';

export interface Project extends Partial<Omit<ProjectResponse, 'content' | 'file' | 'images'>> {
  title: string;
}
export interface Template extends Omit<TemplateResponse, 'content' | 'file' | 'images'> {}

interface History {
  canvas: Canvas;
  target: string;
  action: 'add' | 'change' | 'delele';
}

type Mode = 'edit' | 'view' | 'load';

interface LeftSheet {
  type: 'shapes' | 'images' | 'layers';
}

interface RightSheet {
  type: 'element' | 'history';
  target?: string;
}

interface EditorState {
  canvas: Canvas;
  history: History[];
  historyTarget: number;
  project: Project | null;
  template: Template | null;
  mode: Mode;
  hasUnsavedChanges: boolean;
  leftSheet: LeftSheet | null;
  rightSheet: RightSheet | null;
}

const initialState: EditorState = {
  canvas: initCanvas({ width: DEFAULT_CANVAS_SIZE, height: DEFAULT_CANVAS_SIZE }),
  history: [],
  historyTarget: 0,
  project: null,
  template: null,
  mode: 'edit',
  hasUnsavedChanges: false,
  leftSheet: null,
  rightSheet: null,
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setCanvas: (state, action: PayloadAction<Canvas>) => {
      state.canvas = action.payload;
    },
    updateCanvasBackground: (state, action: PayloadAction<Background>) => {
      state.canvas.background = action.payload;
    },
    setHistory: (state, action: PayloadAction<History[]>) => {
      state.history = action.payload;
    },
    setProject: (
      state,
      action: PayloadAction<{
        project: Partial<ProjectResponse> & Pick<ProjectResponse, 'title'>;
        mode: Mode;
      }>,
    ) => {
      const { content, file: _f, images: _i, ...project } = action.payload.project;

      Object.assign(state, initialState);
      if (content) {
        state.canvas = content;
        state.project = project;
        state.mode = action.payload.mode;
      }
    },
    setTemplate: (state, action: PayloadAction<{ template: TemplateResponse }>) => {
      const { content, file: _f, images: _i, ...template } = action.payload.template;

      Object.assign(state, initialState);
      if (content) {
        state.canvas = content;
        state.template = template;
        state.mode = 'view';
      }
    },
    setMode: (state, action: PayloadAction<Mode>) => {
      state.mode = action.payload;
    },
    setHasUnsavedChanges: (state, action: PayloadAction<boolean>) => {
      state.hasUnsavedChanges = action.payload;
    },
    setLeftSheet: (state, action: PayloadAction<LeftSheet | null>) => {
      state.leftSheet = action.payload ?? null;
    },
    setRightSheet: (state, action: PayloadAction<RightSheet | null>) => {
      state.rightSheet = action.payload ?? null;
    },
    clearEditor: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setCanvas,
  updateCanvasBackground,
  setHistory,
  setProject,
  setTemplate,
  setMode,
  setHasUnsavedChanges,
  setLeftSheet,
  setRightSheet,
  clearEditor,
} = editorSlice.actions;

export const selectEditor = {
  canvas: (state: RootState) => state.editor.canvas,
  history: (state: RootState) => state.editor.history,
  historyTarget: (state: RootState) => state.editor.historyTarget,
  project: (state: RootState) => state.editor.project,
  template: (state: RootState) => state.editor.template,
  mode: (state: RootState) => state.editor.mode,
  hasUnsavedChanges: (state: RootState) => state.editor.hasUnsavedChanges,
  leftSheet: (state: RootState) => state.editor.leftSheet,
  rightSheet: (state: RootState) => state.editor.rightSheet,
};

export default editorSlice.reducer;
