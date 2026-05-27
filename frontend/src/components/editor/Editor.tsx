import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Group, Layer, Line, Rect, Stage, Transformer } from 'react-konva';
import { Portal } from 'react-konva-utils';
import { toast } from 'react-toastify';

import clsx from 'clsx';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';

import {
  addCanvasElements,
  commitCanvasElementsMove,
  deleteCanvasElements,
  moveCanvasElements,
  reorderCanvasElements,
  selectEditor,
  setCanvasSize,
  setLeftSheet,
  setRightSheet,
  setSelectedIds,
  setTool,
  translateCanvasElements,
  updateCanvasBackground,
  updateCanvasElements,
} from '@store/editorSlice';

import { NumberField, SizeField } from '@components/InputFields';
import { MainButton } from '@components/MainButton';
import { Popover } from '@components/Menu';
import { CanvasElementShape, CanvasImage } from '@components/editor/CanvasElementShape';
import { LayersPanel } from '@components/editor/LeftPanels';
import { ElementPanel } from '@components/editor/RightPanels';
import { Sheet } from '@components/editor/Sheet';
import { TextEditor } from '@components/editor/TextEditor';
import { Toolbar } from '@components/editor/Toolbar';

import grabCursor from '@assets/grab.png';
import grabbingCursor from '@assets/grabbing.png';
import { LayerIcon, QuestionIcon, SettingsIcon } from '@assets/index';
import selectCursor from '@assets/select.png';

import { useStageSize } from '@hooks/editor/useStageSize';
import { useToolbar } from '@hooks/editor/useToolbar';
import { useDebounce } from '@hooks/useDebounce';
import { useImages } from '@hooks/useImages';
import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import {
  DEFAULT_BORDER_COLOR,
  DEFAULT_PROPS,
  ERROR_TYPES,
  MAX_CANVAS_SIZE,
  MAX_FILE_SIZE,
  MAX_SCALE,
  MIN_CANVAS_SIZE,
  MIN_SCALE,
  SCALE_FACTOR,
  SUPPORTED_UPLOADS,
} from '@utils/constants';
import { createLocalImageItem, fitSize, getImageItemSize, getImageSize } from '@utils/editorUtils';
import { shortcuts } from '@utils/shortcuts';

import {
  Actions,
  BrushTypes,
  type CanvasElement,
  CanvasElements,
  type CanvasProps,
  LeftSheets,
  Modes,
  RightSheets,
  Tools,
} from '@mytypes/editorTypes';

import './Editor.css';

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return !!target.closest('input, textarea, select, [contenteditable="true"]');
};

const cloneCanvasElement = (element: CanvasElement, offset = 0): CanvasElement => {
  const clone = structuredClone(element);

  return {
    ...clone,
    id: crypto.randomUUID(),
    layerNumber: undefined,
    x: clone.x + offset,
    y: clone.y + offset,
    createdAt: new Date().toISOString(),
  };
};

const areStringArraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const isEraserElement = (element: CanvasElement) =>
  element.type === CanvasElements.Drawing && element.brushType === BrushTypes.Eraser;

const getElementCreatedTime = (element: CanvasElement) => {
  const createdTime = element.createdAt ? new Date(element.createdAt).getTime() : NaN;

  return Number.isNaN(createdTime) ? 0 : createdTime;
};

const getCanvasPaintOrder = (elements: CanvasElement[]) => {
  const orderedElements: CanvasElement[] = [];

  elements.forEach((element) => {
    if (!isEraserElement(element)) {
      orderedElements.push(element);
      return;
    }

    const eraserCreatedTime = getElementCreatedTime(element);
    const firstNewerElementIndex = orderedElements.findIndex(
      (el) => !isEraserElement(el) && getElementCreatedTime(el) > eraserCreatedTime,
    );

    if (firstNewerElementIndex === -1) orderedElements.push(element);
    else orderedElements.splice(firstNewerElementIndex, 0, element);
  });

  return orderedElements;
};

const normalizeRotation = (rotation: number) => {
  const normalized = rotation % 360;

  return normalized < 0 ? normalized + 360 : normalized;
};

const isImageElement = (
  element: CanvasElement,
): element is Extract<CanvasElement, { type: typeof CanvasElements.Image }> =>
  element.type === CanvasElements.Image;

interface PendingGroupTransform {
  ids: string[];
  elements: CanvasElement[];
}

interface TransformModifiers {
  shift: boolean;
  ctrl: boolean;
}

interface ModifierKeysEvent {
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

const hasSameIds = (left: string[], right: string[]) =>
  left.length === right.length && left.every((id) => right.includes(id));

const TRANSFORM_ROTATION_SNAPS = Array.from({ length: 73 }, (_, index) => index * 5);

const getTransformModifiers = (event?: Event): TransformModifiers => {
  const modifierEvent = event as ModifierKeysEvent | undefined;

  return {
    shift: !!modifierEvent?.shiftKey,
    ctrl: !!(modifierEvent?.ctrlKey || modifierEvent?.metaKey),
  };
};

export interface EditorProps extends CanvasProps {
  onSave?: () => void | Promise<unknown>;
}

export const Editor = ({ stageRef, backgroundRef, onSave }: EditorProps) => {
  const dispatch = useAppDispatch();
  const imagesCtx = useImages();
  const clipboardRef = useRef<CanvasElement[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement | null>(null);
  const backdropGroupRef = useRef<Konva.Group | null>(null);
  const canvasElementsRef = useRef<CanvasElement[]>([]);
  const keyboardMoveRef = useRef<{ ids: string[]; from: CanvasElement[] } | null>(null);
  const [keyboardMoveTick, setKeyboardMoveTick] = useState(0);
  const debouncedKeyboardMoveTick = useDebounce(keyboardMoveTick, 500);

  const canvas = useAppSelector(selectEditor.canvas);
  const selectedIds = useAppSelector(selectEditor.selected);
  const tool = useAppSelector(selectEditor.tool);
  const mode = useAppSelector(selectEditor.mode);
  const leftSheet = useAppSelector(selectEditor.leftSheet);
  const rightSheet = useAppSelector(selectEditor.rightSheet);
  const project = useAppSelector(selectEditor.project);
  const canvasPaintElements = useMemo(
    () => getCanvasPaintOrder(canvas.elements),
    [canvas.elements],
  );
  const selectedElementIds = selectedIds.filter((id) => id !== CanvasElements.Background);
  const selectedCanvasElements = canvas.elements.filter((el) => selectedIds.includes(el.id));
  const [isTransforming, setisTransforming] = useState(false);
  const [transformModifiers, setTransformModifiers] = useState<TransformModifiers>({
    shift: false,
    ctrl: false,
  });
  const [pendingGroupTransform, setPendingGroupTransform] = useState<PendingGroupTransform | null>(
    null,
  );
  const hasPendingGroupTransform = !!(
    pendingGroupTransform && hasSameIds(pendingGroupTransform.ids, selectedElementIds)
  );
  const selectedCanvasElementsForRender = hasPendingGroupTransform
    ? pendingGroupTransform.elements
    : selectedCanvasElements;
  const selectedElementIdsForRender = new Set(selectedElementIds);
  const selectedGroupRenderIndex = canvasPaintElements.reduce(
    (lastIndex, el, index) => (selectedElementIdsForRender.has(el.id) ? index : lastIndex),
    -1,
  );

  const { stageSize } = useStageSize();
  const {
    stageZoom,
    setStageZoom,
    selectRectProps,
    transformerRef,
    backdropRef,
    selectGroupRef,
    selectGroupPos,
    setSelectGroupPos,
    eraserCursorRef,
    drawingLineRef,
    isEditingTextRef,
    editedTextRef,
    textEditorRef,
    // onTransformEnd,
    ...toolbarHandlers
  } = useToolbar(stageRef);

  const updateTransformModifiers = useCallback((event?: Event) => {
    const nextModifiers = getTransformModifiers(event);

    setTransformModifiers((currentModifiers) =>
      currentModifiers.shift === nextModifiers.shift && currentModifiers.ctrl === nextModifiers.ctrl
        ? currentModifiers
        : nextModifiers,
    );
  }, []);

  const flushKeyboardMove = useCallback(() => {
    const pendingMove = keyboardMoveRef.current;

    if (!pendingMove) return;

    const to = structuredClone(
      canvasElementsRef.current.filter((el) => pendingMove.ids.includes(el.id)),
    );

    dispatch(
      commitCanvasElementsMove({
        ids: pendingMove.ids,
        from: pendingMove.from,
        to,
      }),
    );
    keyboardMoveRef.current = null;
  }, [dispatch]);

  const handleImageUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).filter(
        (file) => SUPPORTED_UPLOADS.includes(file.type) && file.size <= MAX_FILE_SIZE,
      );

      if (!files.length) {
        e.target.value = '';
        return;
      }

      try {
        const imagesWithSize = await Promise.all(
          files.map(async (file) => {
            const image = createLocalImageItem(file, true);
            const naturalSize = await getImageSize(image.url);

            return {
              image: {
                ...image,
                naturalWidth: naturalSize.width,
                naturalHeight: naturalSize.height,
              },
              size: fitSize(naturalSize, {
                width: canvas.background.width * 0.9,
                height: canvas.background.height * 0.9,
              }),
            };
          }),
        );
        const baseX = (stageSize.width - canvas.background.width) / 2 + 20;
        const baseY = (stageSize.height - canvas.background.height) / 2 + 20;

        imagesCtx?.addLocalImageItems(imagesWithSize.map(({ image }) => image));
        dispatch(setTool(Tools.Select));
        dispatch(
          addCanvasElements(
            imagesWithSize.map(
              ({ image, size }, index) =>
                ({
                  ...DEFAULT_PROPS[CanvasElements.Image],
                  id: crypto.randomUUID(),
                  x: baseX + index * 20,
                  y: baseY + index * 20,
                  width: size.width,
                  height: size.height,
                  image: image.id,
                }) as CanvasElement,
            ),
          ),
        );
      } catch {
        toast(ERROR_TYPES.SWW);
      }
      e.target.value = '';
    },
    [canvas.background.height, canvas.background.width, dispatch, imagesCtx, stageSize],
  );

  const isImageUsedByElements = useCallback(
    (imageId: string, ignoredElementIds: string[] = []) =>
      canvas.elements.some(
        (element) =>
          isImageElement(element) &&
          element.image === imageId &&
          !ignoredElementIds.includes(element.id),
      ),
    [canvas.elements],
  );

  const deleteImageIfUnused = useCallback(
    (
      imageId: string | undefined,
      options: { ignoreBackground?: boolean; ignoredElementIds?: string[] } = {},
    ) => {
      if (!imageId) return;

      const isUsedByBackground = !options.ignoreBackground && canvas.background.image === imageId;
      const isUsedByElement = isImageUsedByElements(imageId, options.ignoredElementIds);

      if (!isUsedByBackground && !isUsedByElement) imagesCtx?.deleteFileTmp(imageId);
    },
    [canvas.background.image, imagesCtx, isImageUsedByElements],
  );

  const handleBackgroundImageUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = Array.from(e.target.files ?? []).find(
        (item) => SUPPORTED_UPLOADS.includes(item.type) && item.size <= MAX_FILE_SIZE,
      );

      if (!file) {
        e.target.value = '';
        return;
      }

      try {
        const imageItem = createLocalImageItem(file, true);
        const naturalSize = await getImageSize(imageItem.url);
        const imageWithSize = {
          ...imageItem,
          naturalWidth: naturalSize.width,
          naturalHeight: naturalSize.height,
        };

        deleteImageIfUnused(canvas.background.image, { ignoreBackground: true });
        imagesCtx?.addLocalImageItems([imageWithSize]);
        dispatch(
          updateCanvasBackground({
            changes: { image: imageWithSize.id },
            action: Actions.Fill,
          }),
        );
      } catch {
        toast(ERROR_TYPES.SWW);
      }
      e.target.value = '';
    },
    [canvas.background.image, deleteImageIfUnused, dispatch, imagesCtx],
  );

  const createImageElement = useCallback(
    async (imageId: string, fallbackSize?: { width: number; height: number }) => {
      const imageItem = imagesCtx?.findImageItem(imageId);
      if (!imageItem) return null;

      let naturalSize = fallbackSize;

      try {
        naturalSize = (await getImageItemSize(imageItem)) ?? fallbackSize;
      } catch {
        naturalSize = fallbackSize;
      }

      if (!naturalSize) return null;

      return {
        ...DEFAULT_PROPS[CanvasElements.Image],
        id: crypto.randomUUID(),
        x: (stageSize.width - canvas.background.width) / 2 + 20,
        y: (stageSize.height - canvas.background.height) / 2 + 20,
        width: naturalSize.width,
        height: naturalSize.height,
        image: imageId,
      } as CanvasElement;
    },
    [
      canvas.background.height,
      canvas.background.width,
      imagesCtx,
      stageSize.height,
      stageSize.width,
    ],
  );

  const handleBackgroundImageToObject = useCallback(async () => {
    const imageId = canvas.background.image;
    if (!imageId) return;

    try {
      if (!imagesCtx || !imagesCtx.findImageItem(imageId)) {
        toast(ERROR_TYPES.SWW);
        return;
      }

      imagesCtx.restoreFile(imageId);
      const imageElement = await createImageElement(imageId, {
        width: canvas.background.width,
        height: canvas.background.height,
      });

      if (!imageElement) return;

      dispatch(addCanvasElements([imageElement]));
      dispatch(updateCanvasBackground({ changes: { image: undefined }, action: Actions.Fill }));
    } catch {
      toast(ERROR_TYPES.SWW);
    }
  }, [
    canvas.background.height,
    canvas.background.image,
    canvas.background.width,
    createImageElement,
    dispatch,
    imagesCtx,
  ]);

  const handleImageToBackground = useCallback(
    (element: CanvasElement) => {
      if (!isImageElement(element)) return;

      if (!imagesCtx || !imagesCtx.findImageItem(element.image)) {
        toast(ERROR_TYPES.SWW);
        return;
      }

      const previousBackgroundImage = canvas.background.image;
      if (previousBackgroundImage && previousBackgroundImage !== element.image) {
        deleteImageIfUnused(previousBackgroundImage, { ignoreBackground: true });
      }

      imagesCtx.restoreFile(element.image);
      dispatch(updateCanvasBackground({ changes: { image: element.image }, action: Actions.Fill }));
      dispatch(setSelectedIds([element.id]));
      dispatch(deleteCanvasElements());
    },
    [canvas.background.image, deleteImageIfUnused, dispatch, imagesCtx],
  );

  const handleClearBackgroundImage = useCallback(() => {
    const imageId = canvas.background.image;
    if (!imageId) return;

    deleteImageIfUnused(imageId, { ignoreBackground: true });
    dispatch(updateCanvasBackground({ changes: { image: undefined }, action: Actions.Fill }));
  }, [canvas.background.image, deleteImageIfUnused, dispatch]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    stage.setPointersPositions(e);
    const p = stage.getRelativePointerPosition();
    if (!p) return;

    try {
      const data = e.dataTransfer.getData('application/json/canvas-element');
      if (!data) return;

      const el: CanvasElement = {
        id: crypto.randomUUID(),
        ...JSON.parse(data),
        x: p.x,
        y: p.y,
      };
      dispatch(setTool(Tools.Select));
      dispatch(addCanvasElements([el]));
    } catch (err) {
      toast(ERROR_TYPES.SWW);
    }
  };

  const resetSelectGroupTransform = useCallback(() => {
    const group = selectGroupRef.current;
    if (!group) return;

    group.position({ x: 0, y: 0 });
    group.scale({ x: 1, y: 1 });
    group.rotation(0);
    setSelectGroupPos({ x: 0, y: 0 });
  }, [selectGroupRef, setSelectGroupPos]);

  const syncBackdropTransform = useCallback(() => {
    const stage = stageRef.current;
    const backdrop = backdropRef.current;
    const backdropGroup = backdropGroupRef.current;
    const transformer = transformerRef.current;
    const node = transformer?.nodes()[0] ?? selectGroupRef.current;

    if (!stage || !backdrop || !backdropGroup || !node || selectedIds.length === 0) {
      backdropGroup?.setAttrs({ x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
      backdrop?.setAttrs({ x: 0, y: 0, width: 0, height: 0 });
      return;
    }

    const box = node.getClientRect({ skipTransform: true });
    const transform = node.getAbsoluteTransform(stage).decompose();

    backdropGroup.setAttrs({
      x: transform.x,
      y: transform.y,
      rotation: transform.rotation,
      scaleX: transform.scaleX,
      scaleY: transform.scaleY,
    });
    backdrop.setAttrs({
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    });
    backdrop.getLayer()?.batchDraw();
  }, [backdropRef, selectedIds.length, selectGroupRef, stageRef, transformerRef]);

  const handleTransformEnd = useCallback(() => {
    const stage = stageRef.current;
    const group = selectGroupRef.current;
    if (!stage || !group) return;

    const selectedIdsForTransform = selectedIds.filter((id) => id !== CanvasElements.Background);
    const selectedElementsBeforeTransform = (
      hasPendingGroupTransform
        ? pendingGroupTransform?.elements
        : canvasElementsRef.current.filter((element) =>
            selectedIdsForTransform.includes(element.id),
          )
    )?.map((element) => structuredClone(element));
    const updates = group
      .find('.element')
      .map((node) => {
        const id = node.id();
        if (!selectedIds.includes(id)) return null;

        const transform = node.getAbsoluteTransform(stage).decompose();

        return {
          id,
          changes: {
            x: transform.x,
            y: transform.y,
            rotation: normalizeRotation(transform.rotation),
            scaleX: transform.scaleX,
            scaleY: transform.scaleY,
          },
        };
      })
      .filter((update): update is NonNullable<typeof update> => !!update);

    if (updates.length) {
      const hasRotationChange = updates.some((update) => {
        const elementBeforeTransform = selectedElementsBeforeTransform?.find(
          (element) => element.id === update.id,
        );
        if (!elementBeforeTransform) return false;

        const previousRotation = normalizeRotation(elementBeforeTransform.rotation);
        const nextRotation = normalizeRotation(update.changes.rotation);

        return Math.abs(previousRotation - nextRotation) > 0.01;
      });

      dispatch(
        updateCanvasElements({
          updates,
          action: hasRotationChange ? Actions.Rotate : Actions.Resize,
        }),
      );
    }

    if (updates.length && selectedIdsForTransform.length > 1 && selectedElementsBeforeTransform) {
      setPendingGroupTransform({
        ids: selectedIdsForTransform,
        elements: selectedElementsBeforeTransform,
      });
      setisTransforming(true);
      window.requestAnimationFrame(() => {
        transformerRef.current?.forceUpdate();
        syncBackdropTransform();
      });
      return;
    }

    setPendingGroupTransform(null);
    setisTransforming(false);
    resetSelectGroupTransform();
  }, [
    dispatch,
    hasPendingGroupTransform,
    pendingGroupTransform?.elements,
    resetSelectGroupTransform,
    selectedIds,
    selectGroupRef,
    stageRef,
    syncBackdropTransform,
    transformerRef,
  ]);

  useLayoutEffect(() => {
    canvasElementsRef.current = canvas.elements;

    transformerRef.current?.forceUpdate();
    transformerRef.current?.getLayer()?.batchDraw();
  }, [canvas.elements, selectedIds, transformerRef]);

  useEffect(() => {
    const handleModifierKey = (event: KeyboardEvent) => updateTransformModifiers(event);
    const resetModifierKeys = () => updateTransformModifiers();

    window.addEventListener('keydown', handleModifierKey);
    window.addEventListener('keyup', handleModifierKey);
    window.addEventListener('blur', resetModifierKeys);

    return () => {
      window.removeEventListener('keydown', handleModifierKey);
      window.removeEventListener('keyup', handleModifierKey);
      window.removeEventListener('blur', resetModifierKeys);
    };
  }, [updateTransformModifiers]);

  useEffect(() => {
    flushKeyboardMove();
  }, [debouncedKeyboardMoveTick, flushKeyboardMove]);

  useEffect(() => () => flushKeyboardMove(), [flushKeyboardMove]);

  useLayoutEffect(() => {
    if (!hasPendingGroupTransform) selectGroupRef.current?.position(selectGroupPos);
    syncBackdropTransform();
  }, [
    canvas.elements,
    hasPendingGroupTransform,
    selectGroupPos,
    selectedIds,
    syncBackdropTransform,
  ]);

  useLayoutEffect(() => {
    if (!pendingGroupTransform || hasPendingGroupTransform) return;

    setPendingGroupTransform(null);
    setisTransforming(false);
    resetSelectGroupTransform();
  }, [hasPendingGroupTransform, pendingGroupTransform, resetSelectGroupTransform]);

  useEffect(() => {
    if (!hasPendingGroupTransform) return;

    setPendingGroupTransform((currentPendingTransform) => {
      if (!currentPendingTransform) return currentPendingTransform;

      let hasChanges = false;
      const nextElements = currentPendingTransform.elements.map((element) => {
        const latestElement = canvas.elements.find((item) => item.id === element.id);

        if (!latestElement) return element;

        hasChanges = true;
        return {
          ...latestElement,
          x: element.x,
          y: element.y,
          rotation: element.rotation,
          scaleX: element.scaleX,
          scaleY: element.scaleY,
        } as CanvasElement;
      });

      return hasChanges
        ? { ...currentPendingTransform, elements: nextElements }
        : currentPendingTransform;
    });
  }, [canvas.elements, hasPendingGroupTransform]);

  useEffect(() => {
    if (mode !== Modes.Edit) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const selectedElementIds = selectedIds.filter((id) => id !== 'background');
      const selectedElements = canvas.elements.filter((el) => selectedElementIds.includes(el.id));
      const isCommand = e.ctrlKey || e.metaKey;

      if (isCommand && e.key.toLowerCase() === 's') {
        e.preventDefault();
        flushKeyboardMove();
        void onSave?.();
        return;
      }

      if (isCommand && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        flushKeyboardMove();
        setStageZoom({ newScale: Math.min(MAX_SCALE, stageZoom * SCALE_FACTOR) });
        return;
      }

      if (isCommand && e.key === '-') {
        e.preventDefault();
        flushKeyboardMove();
        setStageZoom({ newScale: Math.max(MIN_SCALE, stageZoom / SCALE_FACTOR) });
        return;
      }

      if (isCommand && e.key === '0') {
        e.preventDefault();
        flushKeyboardMove();
        setStageZoom({ newScale: 1 });
        return;
      }

      if (isCommand && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        flushKeyboardMove();
        fileInputRef.current?.click();
        return;
      }

      if (isCommand && e.key === '[' && selectedElementIds.length) {
        e.preventDefault();
        flushKeyboardMove();
        dispatch(reorderCanvasElements({ direction: 'backward' }));
        return;
      }

      if (isCommand && e.key === ']' && selectedElementIds.length) {
        e.preventDefault();
        flushKeyboardMove();
        dispatch(reorderCanvasElements({ direction: 'forward' }));
        return;
      }

      if (isCommand && e.key.toLowerCase() === 'c' && selectedElements.length) {
        e.preventDefault();
        flushKeyboardMove();
        clipboardRef.current = structuredClone(selectedElements);
        return;
      }

      if (isCommand && e.key.toLowerCase() === 'x' && selectedElements.length) {
        e.preventDefault();
        flushKeyboardMove();
        clipboardRef.current = structuredClone(selectedElements);
        dispatch(deleteCanvasElements());
        return;
      }

      if (isCommand && e.key.toLowerCase() === 'v' && clipboardRef.current.length) {
        e.preventDefault();
        flushKeyboardMove();
        const pastedElements = clipboardRef.current.map((el) => cloneCanvasElement(el, 10));

        clipboardRef.current = structuredClone(pastedElements);
        dispatch(addCanvasElements(pastedElements));
        return;
      }

      if (isCommand && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        flushKeyboardMove();
        dispatch(setSelectedIds(canvas.elements.map((el) => el.id)));
        return;
      }

      if (e.key === 'Escape' && selectedIds.length) {
        e.preventDefault();
        flushKeyboardMove();
        dispatch(setSelectedIds([]));
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length) {
        e.preventDefault();
        flushKeyboardMove();
        dispatch(deleteCanvasElements());
        return;
      }

      const moveByKey: Record<string, { moveX: number; moveY: number }> = {
        ArrowUp: { moveX: 0, moveY: -1 },
        ArrowDown: { moveX: 0, moveY: 1 },
        ArrowLeft: { moveX: -1, moveY: 0 },
        ArrowRight: { moveX: 1, moveY: 0 },
      };
      const move = moveByKey[e.key];

      if (move && selectedElementIds.length) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;

        if (
          !keyboardMoveRef.current ||
          !areStringArraysEqual(keyboardMoveRef.current.ids, selectedElementIds)
        ) {
          flushKeyboardMove();
          keyboardMoveRef.current = {
            ids: selectedElementIds,
            from: structuredClone(selectedElements),
          };
        }

        dispatch(
          translateCanvasElements({
            ids: selectedElementIds,
            moveX: move.moveX * step,
            moveY: move.moveY * step,
          }),
        );
        setKeyboardMoveTick((tick) => tick + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    canvas.elements,
    dispatch,
    flushKeyboardMove,
    mode,
    onSave,
    selectedIds,
    setStageZoom,
    stageZoom,
  ]);

  return (
    <div className="work-area" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_UPLOADS.join(',')}
        multiple
        hidden
        onChange={handleImageUpload}
      />
      <input
        ref={backgroundFileInputRef}
        type="file"
        accept={SUPPORTED_UPLOADS.join(',')}
        hidden
        onChange={handleBackgroundImageUpload}
      />
      <Toolbar onUploadImage={() => fileInputRef.current?.click()} fileInputRef={fileInputRef} />
      <Stage
        {...stageSize}
        {...toolbarHandlers}
        style={{ background: 'var(--dark-gray)' }}
        draggable={tool === Tools.Grab}
        ref={stageRef}
      >
        <Layer id="background-layer" listening={mode !== Modes.View}>
          <Group
            x={useMemo(() => (stageSize.width - canvas.background.width) / 2, [])}
            y={useMemo(() => (stageSize.height - canvas.background.height) / 2, [])}
          >
            <Rect
              name="excluded"
              width={canvas.background.width}
              height={canvas.background.height}
              fill="white"
              stroke="white"
              shadowOffsetY={4}
              shadowBlur={30}
              shadowOpacity={0.15}
              shadowColor="#341734"
            />
            <Rect {...canvas.background} ref={backgroundRef} />
            {canvas.background.image && <CanvasImage el={canvas.background} />}
            {selectedIds.includes('background') && (
              <Rect
                x={-3}
                y={-3}
                width={canvas.background.width + 6}
                height={canvas.background.height + 6}
                stroke={DEFAULT_BORDER_COLOR}
                strokeWidth={1}
                listening={false}
              />
            )}
          </Group>
        </Layer>
        <Layer id="elements-layer" listening={mode !== Modes.View}>
          {canvasPaintElements.map((el, index) => {
            if (!selectedElementIdsForRender.has(el.id))
              return <CanvasElementShape key={el.id} element={el} />;

            if (index !== selectedGroupRenderIndex) return null;
            return (
              <Portal selector="#act-layer" enabled={isTransforming}>
                <Group ref={backdropGroupRef}>
                  <Rect
                    ref={backdropRef}
                    fill="red"
                    listening={selectedIds.length > 0}
                    draggable
                    onDragStart={(e: KonvaEventObject<DragEvent>) => {
                      e.target.stopDrag();
                      if (selectGroupRef.current) selectGroupRef.current.startDrag();
                    }}
                    onMouseOver={() => {
                      if (stageRef.current && tool === Tools.Select)
                        stageRef.current.container().style.cursor = `url(${grabCursor}), grab`;
                    }}
                    onMouseLeave={() => {
                      if (stageRef.current && tool === Tools.Select)
                        stageRef.current.container().style.cursor = `url(${selectCursor}), default`;
                    }}
                  />
                </Group>
                <Group
                  key="selected-elements"
                  id="select-group"
                  ref={selectGroupRef}
                  draggable={tool === Tools.Select}
                  onDragStart={(e: KonvaEventObject<DragEvent>) => {
                    setSelectGroupPos({ x: e.target.x(), y: e.target.y() });
                    setisTransforming(true);
                  }}
                  onDragMove={() => {
                    syncBackdropTransform();
                    if (stageRef.current)
                      stageRef.current.container().style.cursor = `url(${grabbingCursor}), grabbing`;
                  }}
                  onDragEnd={(e: KonvaEventObject<DragEvent>) => {
                    if (!stageRef.current) return;
                    flushKeyboardMove();
                    const moveX = e.target.x() - selectGroupPos.x;
                    const moveY = e.target.y() - selectGroupPos.y;

                    if (moveX === 0 && moveY === 0) return;
                    dispatch(moveCanvasElements({ moveX, moveY }));
                    setisTransforming(hasPendingGroupTransform);
                    syncBackdropTransform();
                    if (stageRef.current)
                      stageRef.current.container().style.cursor = `url(${grabCursor}), grab`;
                  }}
                  onMouseOver={() => {
                    if (stageRef.current && tool === Tools.Select)
                      stageRef.current.container().style.cursor = `url(${grabCursor}), grab`;
                  }}
                >
                  {selectedCanvasElementsForRender.map((el) => (
                    <CanvasElementShape key={el.id} element={el} />
                  ))}
                </Group>
              </Portal>
            );
          })}
          <Line ref={drawingLineRef} listening={false} />
        </Layer>
        <Layer id="act-layer" listening={mode !== Modes.View}>
          <Transformer
            name="excluded"
            ref={transformerRef}
            boundBoxFunc={(o, n) => (n.width < 1 || n.height < 1 ? o : n)}
            keepRatio={false}
            centeredScaling={transformModifiers.ctrl}
            rotationSnaps={transformModifiers.shift ? TRANSFORM_ROTATION_SNAPS : []}
            rotationSnapTolerance={5}
            borderStroke={DEFAULT_BORDER_COLOR}
            borderStrokeWidth={1}
            anchorFill="white"
            anchorStroke={DEFAULT_BORDER_COLOR}
            anchorStrokeWidth={2}
            anchorSize={10}
            anchorCornerRadius={20}
            onTransformStart={(e) => {
              updateTransformModifiers(e.evt);
              setisTransforming(true);
              syncBackdropTransform();
            }}
            onTransform={(e) => {
              updateTransformModifiers(e.evt);
              syncBackdropTransform();
            }}
            onTransformEnd={handleTransformEnd}
          />
          <Rect {...selectRectProps} />
          {isEditingTextRef.current && (
            <TextEditor textNode={editedTextRef} textEditorRef={textEditorRef} />
          )}
        </Layer>
      </Stage>
      <div className="eraser-cursor-overlay" ref={eraserCursorRef} />

      <div className="bottom-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sheet
            title={LeftSheets.Layers}
            isOpen={leftSheet?.type === LeftSheets.Layers}
            setIsOpen={() => dispatch(setLeftSheet(LeftSheets.Layers))}
            buttonProps={{
              noStyle: true,
              className: 'tool-container mini square',
              tooltipId: LeftSheets.Layers,
              children: (
                <LayerIcon
                  className={clsx('own-color', leftSheet?.type === LeftSheets.Layers && 'active')}
                />
              ),
            }}
          >
            <LayersPanel />
          </Sheet>
          <div className="tool-container mini" style={{ maxWidth: '125px' }}>
            <NumberField
              name="stage-scale"
              value={stageZoom}
              onChange={(e) => setStageZoom({ newScale: e.target.value as number })}
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.1}
              align="center"
              buttons
              format="percent"
              noStyle
              mini
            />
          </div>
        </div>
        {mode !== Modes.View && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="tool-container mini canvas-size-toolbar">
              <SizeField
                name="canvas-size"
                value={{ width: canvas.background.width, height: canvas.background.height }}
                onChange={(e) => dispatch(setCanvasSize(e.target.value))}
                disabled={!!(project && project.template)}
                min={MIN_CANVAS_SIZE}
                max={MAX_CANVAS_SIZE}
                align="center"
                noStyle
                mini
              />
            </div>
            <Sheet
              title={RightSheets.Element}
              isOpen={rightSheet?.type === RightSheets.Element}
              setIsOpen={() => dispatch(setRightSheet(RightSheets.Element))}
              side="right"
              buttonProps={{
                noStyle: true,
                className: 'tool-container mini square',
                tooltipId: RightSheets.Element,
                children: (
                  <SettingsIcon
                    className={clsx(
                      'own-color',
                      rightSheet?.type === RightSheets.Element && 'active',
                    )}
                  />
                ),
              }}
            >
              <ElementPanel
                onUploadBackgroundImage={() => backgroundFileInputRef.current?.click()}
                onBackgroundImageToObject={() => void handleBackgroundImageToObject()}
                onImageToBackground={handleImageToBackground}
                onClearBackgroundImage={handleClearBackgroundImage}
              />
            </Sheet>
            <Popover
              button={
                <MainButton noStyle className="tool-container mini square" tooltipId="help">
                  <QuestionIcon />
                </MainButton>
              }
              className="col mini-gap"
            >
              <h3 className="content-title mini t-art t-center">Shortcuts</h3>
              <hr />
              <div>
                {shortcuts.map((s, i) => (
                  <div key={i} className="row mini-gap">
                    <div
                      style={{
                        color: 'var(--accent-font-color)',
                        fontWeight: 'bold',
                        width: '65px',
                      }}
                    >
                      {s.sc}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>{s.explanation}</div>
                  </div>
                ))}
              </div>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
};
