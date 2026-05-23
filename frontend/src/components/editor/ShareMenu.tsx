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

const API_ORIGIN = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '').replace(/\/$/, '');

const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'Something went wrong';

export const ShareMenu = ({ stageRef, backgroundRef }: CanvasProps) => {
  const dispatch = useAppDispatch();
  const imagesCtx = useImages();
  const project = useAppSelector(selectEditor.project);
  const canvas = useAppSelector(selectEditor.canvas);

  const getPublicProjectUrl = (projectId: number) =>
    `${window.location.origin}/editor?projectId=${projectId}`;

  const getAbsoluteUrl = (url?: string) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;

    return new URL(url, API_ORIGIN || window.location.origin).toString();
  };

  const ensureProjectIsShareable = async (): Promise<ProjectResponse | undefined> => {
    if (!project?.id) {
      toast('Project is not saved yet');
      return;
    }

    try {
      dispatch(setMode(Modes.Load));

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
        editDate: new Date().toISOString(),
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
    const updatedProject = await ensureProjectIsShareable();
    if (!updatedProject) return;

    const subject = encodeURIComponent(`SketCherry project: ${updatedProject.title}`);
    const body = encodeURIComponent(
      `Check out my SketCherry project:\n${getPublicProjectUrl(updatedProject.id)}`,
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareOnFacebook = async () => {
    const updatedProject = await ensureProjectIsShareable();
    if (!updatedProject) return;

    const url = encodeURIComponent(getPublicProjectUrl(updatedProject.id));

    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener');
  };

  const shareOnPinterest = async () => {
    const updatedProject = await ensureProjectIsShareable();
    if (!updatedProject) return;

    const url = encodeURIComponent(getPublicProjectUrl(updatedProject.id));
    const media = encodeURIComponent(getAbsoluteUrl(updatedProject.preview));
    const description = encodeURIComponent(updatedProject.title);

    window.open(
      `https://www.pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${description}`,
      '_blank',
      'noopener',
    );
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
