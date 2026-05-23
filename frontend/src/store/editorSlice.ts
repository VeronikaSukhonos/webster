import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_CANVAS_SIZE } from '@utils/constants';
import { initCanvas } from '@utils/editorUtils';

import {
  type Action,
  Actions,
  type Canvas,
  type CanvasElement,
  type LeftSheetType,
  type Mode,
  Modes,
  type RightSheetType,
  type Size,
  type Tool,
  Tools,
} from '@mytypes/editorTypes';
import type { ProjectResponse, TemplateResponse } from '@mytypes/responseTypes';

import type { RootState } from './store';

interface History {
  ids: string[];
  from?: CanvasElement[];
  to?: CanvasElement[];
  action: Action;
}

export interface Project extends Partial<Omit<ProjectResponse, 'content' | 'file' | 'images'>> {
  title: string;
}
export interface Template extends Omit<TemplateResponse, 'content' | 'file' | 'images'> {}

interface LeftSheet {
  type: LeftSheetType;
}

interface RightSheet {
  type: RightSheetType;
}

interface EditorState {
  canvas: Canvas;
  history: History[];
  historyTarget: number;
  project: Project | null;
  template: Template | null;
  mode: Mode;
  selectedIds: string[];
  hasUnsavedChanges: boolean;
  tool: Tool;
  leftSheet: LeftSheet | null;
  rightSheet: RightSheet | null;
}

const initialState: EditorState = {
  canvas: initCanvas({ width: DEFAULT_CANVAS_SIZE, height: DEFAULT_CANVAS_SIZE }),
  history: [],
  historyTarget: -1, // last
  project: null,
  template: null,
  mode: Modes.Edit,
  selectedIds: [],
  hasUnsavedChanges: false,
  tool: Tools.Select,
  leftSheet: null,
  rightSheet: null,
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
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
          ids: [from.id],
          from: [from],
          to: [state.canvas.background],
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
        state.tool = Tools.Grab;
      }
    },
    setMode: (state, action: PayloadAction<Mode>) => {
      state.mode = action.payload;
    },
    setHasUnsavedChanges: (state, action: PayloadAction<boolean>) => {
      state.hasUnsavedChanges = action.payload;
    },
    updateProjectData: (state, action: PayloadAction<Partial<Project>>) => {
      if (state.project) state.project = { ...state.project, ...action.payload };
    },
    setTool: (state, action: PayloadAction<Tool>) => {
      state.tool = state.tool === action.payload ? Tools.Select : action.payload;
    },
    setSelectedIds: (state, action: PayloadAction<string[]>) => {
      state.selectedIds = action.payload ?? [];
    },
    setLeftSheet: (state, action: PayloadAction<LeftSheetType | null>) => {
      state.leftSheet =
        !action.payload || state.leftSheet?.type === action.payload
          ? null
          : { type: action.payload };
    },
    setRightSheet: (state, action: PayloadAction<RightSheetType | null>) => {
      state.rightSheet =
        !action.payload || state.rightSheet?.type === action.payload
          ? null
          : { type: action.payload };
    },
    clearEditor: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setCanvasSize,
  setHistory,
  setProject,
  setTemplate,
  setMode,
  setHasUnsavedChanges,
  updateProjectData,
  setTool,
  setSelectedIds,
  setLeftSheet,
  setRightSheet,
  clearEditor,
} = editorSlice.actions;

export const selectEditor = {
  canvas: (state: RootState) => state.editor.canvas,
  selected: (state: RootState) => state.editor.selectedIds,
  tool: (state: RootState) => state.editor.tool,
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
