import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_CANVAS_SIZE } from '@utils/constants';
import { initCanvas } from '@utils/editorUtils';

import {
  type Action,
  Actions,
  type Canvas,
  type CanvasElement,
  type Mode,
  Modes,
  type Size,
  type Tool,
  Tools,
} from '@mytypes/editorTypes';
import type { ProjectResponse, TemplateResponse } from '@mytypes/responseTypes';

import type { RootState } from './store';

interface History {
  id: string;
  from?: CanvasElement;
  to?: CanvasElement;
  action: Action;
}

export interface Project extends Partial<Omit<ProjectResponse, 'content' | 'file' | 'images'>> {
  title: string;
}
export interface Template extends Omit<TemplateResponse, 'content' | 'file' | 'images'> {}

// interface LeftSheet {
//   type: 'shapes' | 'images' | 'layers';
// }

// interface RightSheet {
//   type: 'element' | 'history';
//   target?: string;
// }

interface EditorState {
  canvas: Canvas;
  tool: Tool;
  history: History[];
  historyTarget: number;
  project: Project | null;
  template: Template | null;
  mode: Mode;
  hasUnsavedChanges: boolean;
  // leftSheet: LeftSheet | null;
  // rightSheet: RightSheet | null;
}

const initialState: EditorState = {
  canvas: initCanvas({ width: DEFAULT_CANVAS_SIZE, height: DEFAULT_CANVAS_SIZE }),
  tool: Tools.Select,
  history: [],
  historyTarget: -1, // last
  project: null,
  template: null,
  mode: Modes.Edit,
  hasUnsavedChanges: false,
  // leftSheet: null,
  // rightSheet: null,
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setTool: (state, action: PayloadAction<Tool>) => {
      state.tool = action.payload;
    },
    setCanvasSize: (state, action: PayloadAction<Size>) => {
      const { width, height } = action.payload;
      const from = structuredClone({ ...state.canvas.background });

      state.canvas.background.width = width;
      state.canvas.background.height = height;
      if (state.project) {
        state.project.width = width;
        state.project.height = height;
      }
      state.history = [
        ...state.history,
        {
          id: from.id,
          from,
          to: state.canvas.background,
          action: Actions.Resize,
        },
      ];
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
        state.mode = Modes.View;
      }
    },
    setMode: (state, action: PayloadAction<Mode>) => {
      state.mode = action.payload;
    },
    setHasUnsavedChanges: (state, action: PayloadAction<boolean>) => {
      state.hasUnsavedChanges = action.payload;
    },
    // setLeftSheet: (state, action: PayloadAction<LeftSheet | null>) => {
    //   state.leftSheet = action.payload ?? null;
    // },
    // setRightSheet: (state, action: PayloadAction<RightSheet | null>) => {
    //   state.rightSheet = action.payload ?? null;
    // },
    clearEditor: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setTool,
  setCanvasSize,
  setHistory,
  setProject,
  setTemplate,
  setMode,
  setHasUnsavedChanges,
  // setLeftSheet,
  // setRightSheet,
  clearEditor,
} = editorSlice.actions;

export const selectEditor = {
  canvas: (state: RootState) => state.editor.canvas,
  tool: (state: RootState) => state.editor.tool,
  history: (state: RootState) => state.editor.history,
  historyTarget: (state: RootState) => state.editor.historyTarget,
  project: (state: RootState) => state.editor.project,
  template: (state: RootState) => state.editor.template,
  mode: (state: RootState) => state.editor.mode,
  hasUnsavedChanges: (state: RootState) => state.editor.hasUnsavedChanges,
  // leftSheet: (state: RootState) => state.editor.leftSheet,
  // rightSheet: (state: RootState) => state.editor.rightSheet,
};

export default editorSlice.reducer;
