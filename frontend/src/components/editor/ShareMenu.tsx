import { toast } from 'react-toastify';

import projectsApi from '@api/projectsApi';

import { selectEditor, setMode, updateProjectData } from '@store/editorSlice';

import { Menu, MenuItem } from '@components/Menu';

import { EmailIcon, FacebookIcon, LinkIcon, PinterestIcon } from '@assets/index';

import { useImages } from '@hooks/useImages';
import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import { exportFile } from '@utils/editorUtils';

import { type CanvasProps, Modes } from '@mytypes/editorTypes';
import type { ProjectResponse } from '@mytypes/responseTypes';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const API_ORIGIN = API_URL?.replace(/\/api\/?$/, '').replace(/\/$/, '');

const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'Something went wrong';

export const ShareMenu = ({ stageRef, backgroundRef }: CanvasProps) => {
  const dispatch = useAppDispatch();
  const imagesCtx = useImages();
  const project = useAppSelector(selectEditor.project);
  const canvas = useAppSelector(selectEditor.canvas);
  const hasUnsavedChanges = useAppSelector(selectEditor.hasUnsavedChanges);

  const getPublicProjectUrl = (projectId: number) =>
    `${window.location.origin}/editor?projectId=${projectId}`;

  const getProjectShareMetadataUrl = (projectId: number) =>
    `${API_URL || `${window.location.origin}/api`}/projects/${projectId}/share`;

  const getShareDescription = (shareableProject: ProjectResponse) =>
    shareableProject.description?.trim()
      ? `${shareableProject.title}: ${shareableProject.description}`
      : `Check out my SketCherry project: ${shareableProject.title}`;

  const getAbsoluteUrl = (url?: string) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;

    return new URL(url, API_ORIGIN || window.location.origin).toString();
  };

  const getAlreadyShareableProject = () => {
    if (!project?.id || !project.isPublic || hasUnsavedChanges) return;

    return project as ProjectResponse;
  };

  const openPendingShareWindow = () => {
    const shareWindow = window.open('about:blank', '_blank');
    if (shareWindow) shareWindow.opener = null;

    return shareWindow;
  };

  const openExternalShare = async (getUrl: (project: ProjectResponse) => string) => {
    const alreadyShareableProject = getAlreadyShareableProject();
    if (alreadyShareableProject) {
      window.open(getUrl(alreadyShareableProject), '_blank', 'noopener');
      return;
    }

    const shareWindow = openPendingShareWindow();
    const updatedProject = await ensureProjectIsShareable();

    if (!updatedProject) {
      shareWindow?.close();
      return;
    }

    if (shareWindow) shareWindow.location.href = getUrl(updatedProject);
    else window.open(getUrl(updatedProject), '_blank', 'noopener');
  };

  const ensureProjectIsShareable = async (): Promise<ProjectResponse | undefined> => {
    if (!project?.id) {
      toast('Project is not saved yet');
      return;
    }

    const alreadyShareableProject = getAlreadyShareableProject();
    if (alreadyShareableProject) return alreadyShareableProject;

    try {
      dispatch(setMode(Modes.Load));

      if (!hasUnsavedChanges) {
        const { data: res } = await projectsApi.updateProject(project.id, {
          isPublic: true,
          editDate: project.editDate ?? new Date().toISOString(),
        });
        const updatedProject = res.data.project as ProjectResponse;

        dispatch(
          updateProjectData({
            isPublic: updatedProject.isPublic,
            editDate: updatedProject.editDate,
          }),
        );

        return updatedProject;
      }

      const preview = await exportFile({
        stageRef,
        backgroundRef,
        filename: `preview-${project.id}.jpg`,
        format: 'jpg',
        height: 300,
      });
      const { data: res } = await projectsApi.updateProject(project.id, {
        size: { width: canvas.background.width, height: canvas.background.height },
        content: canvas,
        images: imagesCtx?.presentFiles,
        preview,
        isPublic: true,
        editDate: project.editDate ?? new Date().toISOString(),
      });
      const updatedProject = res.data.project as ProjectResponse;

      dispatch(
        updateProjectData({
          isPublic: updatedProject.isPublic,
          preview: updatedProject.preview,
          editDate: updatedProject.editDate,
        }),
      );

      return updatedProject;
    } catch (err) {
      toast(getErrorMessage(err));
      return;
    } finally {
      dispatch(setMode(Modes.Edit));
    }
  };

  const copyLink = async () => {
    const updatedProject = await ensureProjectIsShareable();
    if (!updatedProject) return;

    await navigator.clipboard
      .writeText(getPublicProjectUrl(updatedProject.id))
      .then(() => toast('Project link was copied to the clipboard'))
      .catch(() => toast('Something went wrong'));
  };

  const shareAsEmail = async () => {
    const getEmailUrl = (shareableProject: ProjectResponse) => {
      const subject = encodeURIComponent(`SketCherry project: ${shareableProject.title}`);
      const body = encodeURIComponent(
        `Check out my SketCherry project:\n${getPublicProjectUrl(shareableProject.id)}`,
      );

      return `mailto:?subject=${subject}&body=${body}`;
    };

    const alreadyShareableProject = getAlreadyShareableProject();
    if (alreadyShareableProject) {
      window.location.href = getEmailUrl(alreadyShareableProject);
      return;
    }

    const emailWindow = openPendingShareWindow();
    const updatedProject = await ensureProjectIsShareable();

    if (!updatedProject) {
      emailWindow?.close();
      return;
    }

    if (emailWindow) emailWindow.location.href = getEmailUrl(updatedProject);
    else window.location.href = getEmailUrl(updatedProject);
  };

  const shareOnFacebook = async () => {
    await openExternalShare((shareableProject) => {
      const url = encodeURIComponent(getProjectShareMetadataUrl(shareableProject.id));

      return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    });
  };

  const shareOnPinterest = async () => {
    await openExternalShare((shareableProject) => {
      const url = encodeURIComponent(getPublicProjectUrl(shareableProject.id));
      const media = encodeURIComponent(getAbsoluteUrl(shareableProject.preview));
      const description = encodeURIComponent(getShareDescription(shareableProject));

      return `https://www.pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${description}`;
    });
  };

  return (
    <Menu aria-label="Share project">
      <MenuItem onAction={copyLink}>
        <LinkIcon />
        <span>Copy link</span>
      </MenuItem>
      <MenuItem onAction={shareAsEmail}>
        <EmailIcon />
        <span>Share as email</span>
      </MenuItem>
      <MenuItem onAction={shareOnPinterest}>
        <PinterestIcon className="own-color" />
        <span>Share on Pinterest</span>
      </MenuItem>
      <MenuItem onAction={shareOnFacebook}>
        <FacebookIcon className="own-color" />
        <span>Share on Facebook</span>
      </MenuItem>
    </Menu>
  );
};
