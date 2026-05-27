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
  time: string;
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
  historyPreview: Canvas | null;
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
  historyTarget: -1, // no history
  historyPreview: null,
  project: null,
  template: null,
  mode: Modes.Edit,
  selectedIds: [],
  hasUnsavedChanges: false,
  tool: Tools.Select,
  lastUsedStyle: {
    fill: DEFAULT_FILL_COLOR,
    stroke: DEFAULT_STROKE_COLOR,
    strokeWidth: 2,
    shapeStrokeWidth: 0,
  },
  leftSheet: null,
  rightSheet: null,
};

const normalizeElementOrder = (elements: CanvasElement[]) =>
  elements.map((el, index) => ({ ...el, order: index }));

const getElementLayerTypeKey = (element: CanvasElement) => {
  if (element.type === CanvasElements.Drawing && 'brushType' in element) {
    return `${element.type}:${element.brushType}`;
  }

  return element.type;
};

const getNextLayerNumber = (elements: CanvasElement[], element: CanvasElement) => {
  const key = getElementLayerTypeKey(element);
  const sameTypeElements = elements.filter((el) => getElementLayerTypeKey(el) === key);
  const maxLayerNumber = sameTypeElements.reduce(
    (max, el, index) => Math.max(max, el.layerNumber ?? index + 1),
    0,
  );

  return maxLayerNumber + 1;
};

const prepareCanvasElement = (
  element: CanvasElement,
  order: number,
  existingElements: CanvasElement[],
): CanvasElement => ({
  ...element,
  createdAt: element.createdAt ?? new Date().toISOString(),
  layerNumber: element.layerNumber ?? getNextLayerNumber(existingElements, element),
  order,
});

const normalizeLayerNumbers = (elements: CanvasElement[]) => {
  const preparedElements: CanvasElement[] = [];

  return elements.map((element, index) => {
    const prepared = prepareCanvasElement(element, element.order ?? index, preparedElements);

    preparedElements.push(prepared);
    return prepared;
  });
};

const isHiddenLayerElement = (element: CanvasElement) =>
  element.type === CanvasElements.Drawing && element.brushType === BrushTypes.Eraser;

const addToHistory = (state: any, history: Omit<History, 'time'>) => {
  const { ids, from, to, action } = history;

  if (state.historyTarget !== state.history.length - 1)
    state.history = state.history.slice(0, state.historyTarget + 1);

  state.history = [
    ...state.history,
    {
      ids,
      from,
      to,
      action,
      time: new Date().toString(),
    },
  ];
  state.historyTarget++;
};

const showProjectAt = (state: EditorState, idx: number): boolean => {
  if (idx < -1 || idx > state.history.length - 1) return false;
  const currentTarget = state.historyTarget;
  if (currentTarget === idx) return false;

  let background = state.historyPreview
    ? structuredClone(current(state.historyPreview.background))
    : structuredClone(current(state.canvas.background));
  let elements = state.historyPreview
    ? structuredClone(current(state.historyPreview.elements))
    : structuredClone(current(state.canvas.elements));
  let selected: string[] = [];

  const forward = idx > currentTarget;
  const prop = forward ? 'to' : 'from';
  let cur = forward ? currentTarget + 1 : currentTarget;

  while (forward ? cur <= idx : cur >= idx + 1) {
    const h = state.history[cur];

    switch (h.action) {
      case Actions.Add:
        if (prop === 'to') {
          if (h.to) elements = [...elements, ...(h.to as CanvasElement[])];
          selected = h.ids;
        } else {
          elements = elements.filter((el) => !h.ids.includes(el.id));
          selected = [];
        }
        break;
      case Actions.Move:
      case Actions.Rotate:
      case Actions.Stroke:
      case Actions.Shadow:
      case Actions.TextFont:
      case Actions.TextContent:
      case Actions.TextSize:
      case Actions.TextAlignment:
      case Actions.ImageCrop:
        elements = elements.map((el) => {
          const i = h.ids.indexOf(el.id);
          return i !== -1 && h[prop] ? (h[prop] as CanvasElement[])[i] : el;
        });
        selected = h.ids;
        break;
      case Actions.Fill:
      case Actions.Resize:
        if (h.ids.includes(background.id) && h[prop]) {
          const bgIdx = h.ids.indexOf(background.id);
          background = h[prop][bgIdx] as Background;
        }
        elements = elements.map((el) => {
          const i = h.ids.indexOf(el.id);
          return i !== -1 && h[prop] ? (h[prop] as CanvasElement[])[i] : el;
        });
        selected = h.ids.filter((id) => id !== background.id);
        break;
      case Actions.AddBgImage:
      case Actions.RemoveBgImage:
        if (h.ids.includes(background.id) && h[prop]) {
          const bgIdx = h.ids.indexOf(background.id);
          background = h[prop][bgIdx] as Background;
        }
        break;
      case Actions.Layer:
        if (h[prop]) elements = h[prop] as CanvasElement[];
        selected = h.ids;
        break;
      case Actions.Delete:
        if (prop === 'to') {
          elements = elements.filter((el) => !h.ids.includes(el.id));
          selected = [];
        } else {
          if (h.from) elements = [...elements, ...(h.from as CanvasElement[])];
          selected = h.ids;
        }
        break;
      default:
        break;
    }
    cur += forward ? 1 : -1;
  }

  if (!state.historyPreview) {
    state.historyPreview = { background, elements };
  } else {
    state.historyPreview.background = background;
    state.historyPreview.elements = elements;
  }

  state.historyTarget = idx;
  state.selectedIds = selected;
  return true;
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setCanvasSize: (state, action: PayloadAction<Size>) => {
      const { width, height } = action.payload;
      const from = current(state.canvas.background);

      state.canvas.background.width = width;
      state.canvas.background.height = height;

      if (state.project) {
        state.project.width = width;
        state.project.height = height;
      }
      addToHistory(state, {
        ids: [from.id],
        from: [from],
        to: [state.canvas.background],
        action: Actions.Resize,
      });
    },
    updateCanvasBackground: (
      state,
      action: PayloadAction<{ changes: Partial<Background>; action?: Action }>,
    ) => {
      const from = current(state.canvas.background);

      state.canvas.background = { ...state.canvas.background, ...action.payload.changes };

      addToHistory(state, {
        ids: [state.canvas.background.id],
        from: [from],
        to: [state.canvas.background],
        action: action.payload.action ?? Actions.Fill,
      });
    },
    addCanvasElement: (state, action: PayloadAction<CanvasElement>) => {
      const el = prepareCanvasElement(
        action.payload,
        state.canvas.elements.length,
        state.canvas.elements,
      );

      state.canvas.elements = [...state.canvas.elements, el];

      addToHistory(state, {
        ids: [action.payload.id],
        from: undefined,
        to: [el],
        action: Actions.Add,
      });
    },
    addCanvasElements: (state, action: PayloadAction<CanvasElement[]>) => {
      if (!action.payload.length) return;

      let existingElements = [...state.canvas.elements];
      const elements = action.payload.map((el, index) => {
        const prepared = prepareCanvasElement(
          el,
          state.canvas.elements.length + index,
          existingElements,
        );

        existingElements = [...existingElements, prepared];
        return prepared;
      });

      state.canvas.elements = [...state.canvas.elements, ...elements];
      state.selectedIds = elements.map((el) => el.id);

      addToHistory(state, {
        ids: elements.map((el) => el.id),
        from: undefined,
        to: elements,
        action: Actions.Add,
      });
    },
    deleteCanvasElements: (state, _action: PayloadAction<undefined>) => {
      const existingIds = new Set(state.canvas.elements.map((el) => el.id));
      const ids = state.selectedIds.filter((id) => existingIds.has(id));

      if (!ids.length) return;

      const from = structuredClone(
        current(state.canvas.elements).filter((el) => ids.includes(el.id)),
      );

      state.canvas.elements = normalizeElementOrder(
        state.canvas.elements.filter((el) => !ids.includes(el.id)),
      );
      state.selectedIds = [];

      addToHistory(state, { ids, from, to: undefined, action: Actions.Delete });
    },
    moveCanvasElements: (state, action: PayloadAction<{ moveX: number; moveY: number }>) => {
      const { moveX, moveY } = action.payload;
      if (!moveX && !moveY) return;

      const existingIds = new Set(state.canvas.elements.map((el) => el.id));
      const ids = state.selectedIds.filter((id) => existingIds.has(id));

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

      addToHistory(state, { ids, from, to, action: Actions.Move });
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

      addToHistory(state, { ids, from, to, action: Actions.Move });
    },
    updateCanvasElements: (
      state,
      action: PayloadAction<{
        updates: { id: string; changes: Partial<CanvasElement> }[];
        action?: Action;
      }>,
    ) => {
      if (!action.payload.updates.length) return;

      const updates = new Map(
        action.payload.updates.map((update) => [update.id, update.changes] as const),
      );
      const from = structuredClone(
        current(state.canvas.elements).filter((el) => updates.has(el.id)),
      );
      const to: CanvasElement[] = [];

      if (!from.length) return;

      state.canvas.elements = state.canvas.elements.map((el) => {
        const changes = updates.get(el.id);
        if (!changes) return el;

        const updated = { ...el, ...changes } as CanvasElement;
        to.push(updated);
        return updated;
      });

      addToHistory(state, {
        ids: to.map((el) => el.id),
        from,
        to,
        action: action.payload.action ?? Actions.Resize,
      });
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
      addToHistory(state, { ids: selectedIds, from, to, action: Actions.Layer });
    },
    setHistory: (state, action: PayloadAction<History[]>) => {
      state.history = action.payload;
    },
    restoreProjectAt: (state, action: PayloadAction<number>) => {
      const idx = action.payload;
      if (idx === state.historyTarget && state.historyPreview) {
        state.canvas.background = state.historyPreview.background;
        state.canvas.elements = state.historyPreview.elements;
        state.history = state.history.slice(0, idx + 1);
        state.historyPreview = null;
        return;
      }
      if (showProjectAt(state, idx) && state.historyPreview) {
        state.canvas.background = state.historyPreview.background;
        state.canvas.elements = state.historyPreview.elements;
        state.history = state.history.slice(0, idx + 1);
        state.historyPreview = null;
      }
    },
    setHistoryTarget: (state, action: PayloadAction<number>) => {
      showProjectAt(state, action.payload);
    },
    handleUndoRedo: (state, action: PayloadAction<number>) => {
      if (showProjectAt(state, action.payload) && state.historyPreview) {
        state.canvas.background = state.historyPreview.background;
        state.canvas.elements = state.historyPreview.elements;
        state.historyPreview = null;
        state.history = [...state.history];
      }
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
        state.canvas = {
          ...content,
          elements: normalizeLayerNumbers(content.elements),
        };
        state.project = project;
        state.mode = action.payload.mode;
      }
    },
    setTemplate: (state, action: PayloadAction<{ template: TemplateResponse }>) => {
      const { content, file: _f, images: _i, ...template } = action.payload.template;

      Object.assign(state, initialState);
      if (content) {
        state.canvas = {
          ...content,
          elements: normalizeLayerNumbers(content.elements),
        };
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
  updateCanvasBackground,
  addCanvasElement,
  addCanvasElements,
  deleteCanvasElements,
  moveCanvasElements,
  translateCanvasElements,
  commitCanvasElementsMove,
  updateCanvasElements,
  reorderCanvasElements,
  setHistory,
  restoreProjectAt,
  handleUndoRedo,
  setHistoryTarget,
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
  canvas: (state: RootState) => state.editor.historyPreview || state.editor.canvas,
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
