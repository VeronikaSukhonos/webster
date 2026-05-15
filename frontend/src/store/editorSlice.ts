import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_CANVAS_SIZE } from '@utils/constants';
import { initCanvas } from '@utils/editorUtils';

import { type Canvas } from '@mytypes/editorTypes';
import type { ProjectResponse, TemplateResponse } from '@mytypes/responseTypes';

import type { RootState } from './store';

type Project = Omit<ProjectResponse, 'content' | 'file' | 'preview' | 'images'>;
type Template = Omit<TemplateResponse, 'content' | 'file' | 'preview' | 'images'>;
type Mode = 'edit' | 'view' | 'load';

interface History {
  canvas: Canvas;
  target: string;
  action: 'add' | 'change' | 'delele';
}

interface LeftSheet {
  type: 'shapes' | 'images' | 'layers';
}

interface RightSheet {
  type: 'element' | 'history';
  target?: string;
}

interface EditorState {
  title: string;
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
  title: 'Untitled',
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
    setTitle: (state, action: PayloadAction<string>) => {
      state.title = action.payload;
    },
    setCanvas: (state, action: PayloadAction<Canvas>) => {
      state.canvas = action.payload;
    },
    setProject: (state, action: PayloadAction<{ project: ProjectResponse; mode: Mode }>) => {
      const { content, ...project } = action.payload.project;

      Object.assign(state, initialState);
      state.title = project.title;
      state.canvas = content as unknown as Canvas;
      state.project = project;
      state.mode = action.payload.mode;
    },
    setTemplate: (state, action: PayloadAction<{ template: TemplateResponse }>) => {
      const { content, ...template } = action.payload.template;

      Object.assign(state, initialState);
      state.title = template.title;
      state.canvas = content as unknown as Canvas;
      state.template = template;
      state.mode = 'view';
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
  setTitle,
  setCanvas,
  setProject,
  setTemplate,
  setMode,
  setHasUnsavedChanges,
  setLeftSheet,
  setRightSheet,
  clearEditor,
} = editorSlice.actions;

export const selectEditor = {
  title: (state: RootState) => state.editor.title,
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
