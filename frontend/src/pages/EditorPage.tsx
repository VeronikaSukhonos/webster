import { useCallback, useEffect, useRef, useState } from 'react';
import { type BlockerFunction, useBlocker, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import type Konva from 'konva';

import projectsApi from '@api/projectsApi';
import templatesApi from '@api/templatesApi';

import {
  clearEditor,
  selectEditor,
  setHasUnsavedChanges,
  setHistory,
  setMode,
  setProject,
  setTemplate,
  updateProjectData,
} from '@store/editorSlice';

import { Load } from '@components/Load';
import { Editor } from '@components/editor/Editor';
import { EditorHeader } from '@components/editor/EditorHeader';

import { useStageSize } from '@hooks/editor/useStageSize';
import { useDebounce } from '@hooks/useDebounce';
import { useImages } from '@hooks/useImages';
import { useAppDispatch, useAppSelector, useAuth } from '@hooks/utilHooks';

import { AUTOSAVE_DELAY } from '@utils/constants';
import { exportFile } from '@utils/editorUtils';

import { Modes } from '@mytypes/editorTypes';

const EditorPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const auth = useAuth();
  const imagesCtx = useImages();

  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const pId = parseInt(projectId as string);
  const templateId = searchParams.get('templateId');
  const tId = parseInt(templateId as string);

  const [isLoading, setIsLoading] = useState(true);

  const canvas = useAppSelector(selectEditor.canvas);
  const project = useAppSelector(selectEditor.project);
  const template = useAppSelector(selectEditor.template);
  const mode = useAppSelector(selectEditor.mode);

  const isAuthor = !!auth && !!project && project.author?.id === auth.id;
  const history = useAppSelector(selectEditor.history);
  const dbHistory = useDebounce(history, AUTOSAVE_DELAY);
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedHistoryRef = useRef(history);
  const hasUnsavedChanges = lastSavedHistoryRef.current !== history;

  const stageRef = useRef<Konva.Stage | null>(null);
  const backgroundRef = useRef<Konva.Rect | null>(null);

  const { stageSize } = useStageSize();

  const shouldBlock = useCallback<BlockerFunction>(() => {
    if (!auth) return history.length > 0;
    if (isAuthor) return hasUnsavedChanges || isSaving;
    return false;
  }, [history, isAuthor, hasUnsavedChanges, isSaving]);
  const blocker = useBlocker(shouldBlock);

  const saveProject = useCallback(async () => {
    if (!project || !project.id) return true;
    try {
      setIsSaving(true);
      const { data: res } = await projectsApi.updateProject(project.id, {
        size: { width: canvas.background.width, height: canvas.background.height },
        content: canvas,
        images: imagesCtx?.presentFiles,
        preview: await exportFile({
          // stageRef,
          // backgroundRef,
          filename: `preview-${project.id}.jpg`,
          format: 'jpg',
          height: 300,
          content: canvas,
          images: imagesCtx?.presentFiles,
          stageX: (stageSize.width - canvas.background.width) / 2,
          stageY: (stageSize.height - canvas.background.height) / 2,
        }),
        editDate: new Date().toISOString(),
      });
      dispatch(
        updateProjectData({
          preview: res.data.project.preview,
          editDate: res.data.project.editDate,
        }),
      );
      lastSavedHistoryRef.current = history;
      setIsSaving(false);
      return true;
    } catch (err: any) {
      setIsSaving(false);
      toast(err.message);
      return false;
    }
  }, [project, canvas, history, imagesCtx?.presentFiles]);

  useEffect(() => {
    dispatch(setHasUnsavedChanges(hasUnsavedChanges));
  }, [hasUnsavedChanges]);

  useEffect(() => {
    let last = true;

    if (!projectId && !templateId) {
      if (!project) navigate('/');
      else setIsLoading(false);
      return;
    }
    if ((projectId && !pId) || (templateId && !tId)) {
      setSearchParams({});
      return;
    }
    if (pId === project?.id && project?.author?.id === auth?.id) {
      setIsLoading(false);
      return;
    }

    (async () => {
      setIsLoading(true);
      try {
        if (pId) {
          const { data: res } = await projectsApi.getProject(pId);
          if (!last) return;
          dispatch(
            setProject({
              project: res.data.project,
              mode: res.data.project.author.id === auth?.id ? Modes.Edit : Modes.View,
            }),
          );
          imagesCtx?.replaceImageItems(res.data.project.images, true);
          setIsLoading(false);
        } else if (tId) {
          const { data: res } = await templatesApi.getTemplate(tId);
          if (!last) return;
          dispatch(setTemplate({ template: res.data.template }));
          imagesCtx?.replaceImageItems(res.data.template.images, true);
          setIsLoading(false);
        }
      } catch (err) {
        if (!last) return;
        if (project || template) {
          dispatch(clearEditor());
          imagesCtx?.clearFiles();
        } else {
          toast((err as any).message);
        }
        setSearchParams({});
      }
    })();

    return () => {
      last = false;
    };
  }, [projectId, templateId, auth]);

  useEffect(() => {
    lastSavedHistoryRef.current = history;
    if (project?.preview?.includes('default')) dispatch(setHistory([]));
  }, [project?.id]);

  useEffect(() => {
    if (isAuthor && hasUnsavedChanges) saveProject();
  }, [dbHistory]);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;

    if (!auth) {
      const confirmLeave = window.confirm(
        'Your changes will not be saved. Do you really want to leave?',
      );

      if (confirmLeave) blocker.proceed();
      else blocker.reset();
    } else {
      (async () => {
        const m = mode;

        dispatch(setMode(Modes.Load));
        if (await saveProject()) {
          blocker.proceed();
          return;
        }
        dispatch(setMode(m === Modes.HalfEdit ? Modes.HalfEdit : Modes.Edit));

        const confirmLeave = window.confirm(
          'We could not save your last changes. Do you really want to leave?',
        );

        if (confirmLeave) blocker.proceed();
        else blocker.reset();
      })();
    }
  }, [blocker]);

  useEffect(() => {
    const shouldConfirmLeave =
      (!auth && history.length > 0) || (isAuthor && (hasUnsavedChanges || isSaving));

    if (!shouldConfirmLeave) return;

    const confirm = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', confirm);

    return () => {
      window.removeEventListener('beforeunload', confirm);
    };
  }, [history, isAuthor, hasUnsavedChanges, isSaving]);

  if (isLoading || (!project && !template)) return <Load />;

  return (
    <>
      <EditorHeader
        content={canvas}
        images={imagesCtx?.presentFiles}
        stageX={(stageSize.width - canvas.background.width) / 2}
        stageY={(stageSize.height - canvas.background.height) / 2}
        onSave={saveProject}
      />
      <main className="full-screen">
        <Editor stageRef={stageRef} backgroundRef={backgroundRef} onSave={saveProject} />
      </main>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--transparent-black)',
          height: '100vh',
          width: '100vw',
          position: 'fixed',
          ...(mode === Modes.Load
            ? { opacity: 1, zIndex: 1000 }
            : { opacity: 0, zIndex: -1, pointerEvents: 'none' }),
          transition: 'all ease-in-out 0.2s',
        }}
      >
        <Load spinner />
      </div>
    </>
  );
};

export default EditorPage;
