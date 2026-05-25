import { createSlice, current } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_CANVAS_SIZE, DEFAULT_FILL_COLOR, DEFAULT_STROKE_COLOR } from '@utils/constants';
import { initCanvas } from '@utils/editorUtils';

import {
  type Action,
  Actions,
  type Background,
  BrushTypes,
  type Canvas,
  type CanvasElement,
  CanvasElements,
  type LastUsedStyle,
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
  from?: (CanvasElement | Background)[];
  to?: (CanvasElement | Background)[];
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
  lastUsedStyle: LastUsedStyle;
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
  lastUsedStyle: { fill: DEFAULT_FILL_COLOR, stroke: DEFAULT_STROKE_COLOR, strokeWidth: 2 },
  leftSheet: null,
  rightSheet: null,
};

const normalizeElementOrder = (elements: CanvasElement[]) =>
  elements.map((el, index) => ({ ...el, order: index }));

const prepareCanvasElement = (element: CanvasElement, order: number): CanvasElement => ({
  ...element,
  createdAt: element.createdAt ?? new Date().toISOString(),
  order,
});

const isHiddenLayerElement = (element: CanvasElement) =>
  element.type === CanvasElements.Drawing && element.brushType === BrushTypes.Eraser;

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
    addCanvasElement: (state, action: PayloadAction<CanvasElement>) => {
      const el = prepareCanvasElement(action.payload, state.canvas.elements.length);

      state.canvas.elements = [...state.canvas.elements, el];

      state.history = [
        ...state.history,
        {
          ids: [action.payload.id],
          from: undefined,
          to: [el],
          action: Actions.Add,
        },
      ];
    },
    addCanvasElements: (state, action: PayloadAction<CanvasElement[]>) => {
      if (!action.payload.length) return;

      const elements = action.payload.map((el, index) =>
        prepareCanvasElement(el, state.canvas.elements.length + index),
      );

      state.canvas.elements = [...state.canvas.elements, ...elements];
      state.selectedIds = elements.map((el) => el.id);

      state.history = [
        ...state.history,
        {
          ids: elements.map((el) => el.id),
          from: undefined,
          to: elements,
          action: Actions.Add,
        },
      ];
    },
    deleteCanvasElements: (state, _action: PayloadAction<undefined>) => {
      const ids = current(state.canvas.elements)
        .filter((el) => state.selectedIds.includes(el.id))
        .map((el) => el.id);

      if (!ids.length) return;

      const from = structuredClone(
        current(state.canvas.elements).filter((el) => ids.includes(el.id)),
      );

      state.canvas.elements = normalizeElementOrder(
        state.canvas.elements.filter((el) => !ids.includes(el.id)),
      );
      state.selectedIds = [];

      state.history = [
        ...state.history,
        {
          ids,
          from,
          to: undefined,
          action: Actions.Delete,
        },
      ];
    },
    moveCanvasElements: (state, action: PayloadAction<{ moveX: number; moveY: number }>) => {
      const { moveX, moveY } = action.payload;
      if (!moveX && !moveY) return;

      const ids = current(state.canvas.elements)
        .filter((el) => state.selectedIds.includes(el.id))
        .map((el) => el.id);

      if (!ids.length) return;

      const from = structuredClone(
        current(state.canvas.elements).filter((el) => ids.includes(el.id)),
      );
      const to: typeof from = [];

      state.canvas.elements = state.canvas.elements.map((el) => {
        if (ids.includes(el.id)) {
          const updated = { ...el, x: el.x + moveX, y: el.y + moveY };
          to.push(updated);
          return updated;
        } else return el;
      });

      state.history = [
        ...state.history,
        {
          ids,
          from,
          to,
          action: Actions.Move,
        },
      ];
    },
    translateCanvasElements: (
      state,
      action: PayloadAction<{ ids: string[]; moveX: number; moveY: number }>,
    ) => {
      const { ids, moveX, moveY } = action.payload;
      if ((!moveX && !moveY) || !ids.length) return;

      state.canvas.elements = state.canvas.elements.map((el) =>
        ids.includes(el.id) ? { ...el, x: el.x + moveX, y: el.y + moveY } : el,
      );
    },
    commitCanvasElementsMove: (
      state,
      action: PayloadAction<{ ids: string[]; from: CanvasElement[]; to: CanvasElement[] }>,
    ) => {
      const { ids, from, to } = action.payload;
      if (!ids.length || !from.length || !to.length) return;

      state.history = [
        ...state.history,
        {
          ids,
          from,
          to,
          action: Actions.Move,
        },
      ];
    },
    reorderCanvasElements: (
      state,
      action: PayloadAction<{ ids?: string[]; direction: 'backward' | 'forward' }>,
    ) => {
      const ids = action.payload.ids?.length ? action.payload.ids : state.selectedIds;
      const selectedIds = ids.filter((id) => state.canvas.elements.some((el) => el.id === id));

      if (!selectedIds.length) return;

      const from = structuredClone(current(state.canvas.elements));
      const movingIds = new Set(selectedIds);
      const reordered = [...current(state.canvas.elements)];

      if (action.payload.direction === 'forward') {
        for (let i = reordered.length - 2; i >= 0; i--) {
          if (!movingIds.has(reordered[i].id)) continue;

          const nextVisibleIndex = reordered.findIndex(
            (el, index) => index > i && !movingIds.has(el.id) && !isHiddenLayerElement(el),
          );

          if (nextVisibleIndex === -1) continue;

          const [movingElement] = reordered.splice(i, 1);
          reordered.splice(nextVisibleIndex, 0, movingElement);
        }
      } else {
        for (let i = 1; i < reordered.length; i++) {
          if (!movingIds.has(reordered[i].id)) continue;

          let prevVisibleIndex = -1;
          for (let j = i - 1; j >= 0; j--) {
            if (!movingIds.has(reordered[j].id) && !isHiddenLayerElement(reordered[j])) {
              prevVisibleIndex = j;
              break;
            }
          }

          if (prevVisibleIndex === -1) continue;

          const [movingElement] = reordered.splice(i, 1);
          reordered.splice(prevVisibleIndex, 0, movingElement);
        }
      }

      const to = normalizeElementOrder(reordered);
      const hasChanged = from.some((el, index) => el.id !== to[index]?.id);

      if (!hasChanged) return;

      state.canvas.elements = to;
      state.history = [
        ...state.history,
        {
          ids: selectedIds,
          from,
          to,
          action: Actions.Layer,
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
    updateTemplateData: (state, action: PayloadAction<Partial<Template>>) => {
      if (state.template) state.template = { ...state.template, ...action.payload };
    },
    updateLastUsedStyle: (state, action: PayloadAction<Partial<LastUsedStyle>>) => {
      state.lastUsedStyle = { ...state.lastUsedStyle, ...action.payload };
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
  addCanvasElement,
  addCanvasElements,
  deleteCanvasElements,
  moveCanvasElements,
  translateCanvasElements,
  commitCanvasElementsMove,
  reorderCanvasElements,
  setHistory,
  setProject,
  setTemplate,
  setMode,
  setHasUnsavedChanges,
  updateProjectData,
  updateTemplateData,
  updateLastUsedStyle,
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
  lastUsedStyle: (state: RootState) => state.editor.lastUsedStyle,
  hasUnsavedChanges: (state: RootState) => state.editor.hasUnsavedChanges,
  leftSheet: (state: RootState) => state.editor.leftSheet,
  rightSheet: (state: RootState) => state.editor.rightSheet,
};

export default editorSlice.reducer;
