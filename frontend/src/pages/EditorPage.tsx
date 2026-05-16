import { useCallback, useEffect, useRef, useState } from 'react';
import { type BlockerFunction, useBlocker, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import type Konva from 'konva';

import projectsApi from '@api/projectsApi';
import templatesApi from '@api/templatesApi';

import {
  selectEditor,
  setHasUnsavedChanges,
  setHistory,
  setMode,
  setProject,
  setTemplate,
} from '@store/editorSlice';

import { Load } from '@components/Load';
import { Editor } from '@components/editor/Editor';
import { EditorHeader } from '@components/editor/EditorHeader';

import { useDebounce } from '@hooks/useDebounce';
import { useImages } from '@hooks/useImages';
import { useAppDispatch, useAppSelector, useAuth } from '@hooks/utilHooks';

import { AUTOSAVE_DELAY } from '@utils/constants';
import { exportFile } from '@utils/editorUtils';

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
  const stageRef = useRef<Konva.Stage | null>(null);
  const project = useAppSelector(selectEditor.project);
  const isAuthor = !!auth && !!project && project.author?.id === auth.id;

  const history = useAppSelector(selectEditor.history);
  const dbHistory = useDebounce(history, AUTOSAVE_DELAY);
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedHistoryRef = useRef(history);
  const hasUnsavedChanges = lastSavedHistoryRef.current !== history;

  const template = useAppSelector(selectEditor.template);

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
      await projectsApi.updateProject(project.id, {
        size: { width: canvas.background.width, height: canvas.background.height },
        content: canvas,
        images: imagesCtx?.presentFiles,
        preview: await exportFile({
          stageRef,
          filename: `preview-${project.id}.jpg`,
          format: 'jpg',
          height: 300,
        }),
        editDate: new Date().toISOString(),
      });
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
    if (pId === project?.id) {
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
              mode: res.data.project.author.id === auth?.id ? 'edit' : 'view',
            }),
          );
          imagesCtx?.replaceImageItems(res.data.project.images, true);
        } else if (tId) {
          const { data: res } = await templatesApi.getTemplate(tId);
          if (!last) return;
          dispatch(setTemplate(res.data.template));
          imagesCtx?.replaceImageItems(res.data.template.images, true);
        }
        if (last) setIsLoading(false);
      } catch (err) {
        if (!last) return;
        toast((err as any).message);
        setSearchParams({});
        setIsLoading(false);
      }
    })();

    return () => {
      last = false;
    };
  }, [projectId, templateId]);

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
        dispatch(setMode('load'));
        if (await saveProject()) {
          blocker.proceed();
          return;
        }
        dispatch(setMode('edit'));

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
      <EditorHeader stageRef={stageRef} />
      <main className="full-screen">
        <Editor stageRef={stageRef} />
      </main>
    </>
  );
};

export default EditorPage;
