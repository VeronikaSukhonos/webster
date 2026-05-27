import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import authApi from '@api/authApi';
import projectsApi from '@api/projectsApi';

import { setAuthUser } from '@store/authSlice';
import { selectEditor, setMode, updateProjectData } from '@store/editorSlice';
import { selectUi } from '@store/uiSlice';

import { MainButton } from '@components/MainButton';
import { DropdownMenu, MenuItem } from '@components/Menu';

import { LogoutIcon, ProfileIcon, SettingsIcon } from '@assets/index';

import { useImages } from '@hooks/useImages';
import { useAppDispatch, useAppSelector, useAuth } from '@hooks/utilHooks';

import { exportFile } from '@utils/editorUtils';

import { type Canvas, type ImageItem, Modes } from '@mytypes/editorTypes';

export const AuthMenu = ({
  content,
  images = [],
  stageX = 0,
  stageY = 0,
}: {
  content?: Canvas;
  images?: ImageItem[];
  stageX?: number;
  stageY?: number;
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const auth = useAuth();
  const isAvatarLoading = useAppSelector(selectUi.isAvatarLoading);
  const [isLoading, setIsLoading] = useState(false);
  const imagesCtx = useImages();

  const hasUnsavedChanges = useAppSelector(selectEditor.hasUnsavedChanges);
  const canvas = useAppSelector(selectEditor.canvas);
  const project = useAppSelector(selectEditor.project);
  const mode = useAppSelector(selectEditor.mode);

  const logout = (nav: boolean = false) => {
    setIsLoading(true);
    authApi
      .logout()
      .then(() => {
        dispatch(setAuthUser(null));
        setIsLoading(false);
        if (nav) navigate('/login');
      })
      .catch((err) => {
        setIsLoading(false);
        toast(err.message);
      });
  };

  const saveAndlogout = async () => {
    if (auth && project && project.id && project.author?.id === auth.id) {
      if (hasUnsavedChanges) {
        const m = mode;

        setIsLoading(true);
        dispatch(setMode(Modes.Load));

        projectsApi
          .updateProject(project.id, {
            size: { width: canvas.background.width, height: canvas.background.height },
            content: canvas,
            images: imagesCtx?.presentFiles,
            ...(content && {
              preview: await exportFile({
                // stageRef,
                // backgroundRef,
                filename: `preview-${project.id}.jpg`,
                format: 'jpg',
                height: 300,
                content,
                images,
                stageX,
                stageY,
              }),
            }),
            editDate: new Date().toISOString(),
          })
          .then(({ data: res }) => {
            dispatch(
              updateProjectData({
                preview: res.data.project.preview,
                editDate: res.data.project.editDate,
              }),
            );
            logout();
          })
          .catch((err) => {
            dispatch(setMode(m === Modes.HalfEdit ? Modes.HalfEdit : Modes.Edit));
            setIsLoading(false);
            toast(err.message);
          });
      } else {
        logout();
      }
    } else {
      logout(true);
    }
  };

  return (
    <DropdownMenu
      button={
        <MainButton color="white" square style={{ borderRadius: '50%' }} aria-label="Account Menu">
          <img
            className={'auth-avatar' + (isAvatarLoading ? ' img-load' : '')}
            src={auth?.avatar}
            alt="My avatar"
          />
        </MainButton>
      }
    >
      <MenuItem>
        <NavLink className="m-row" to={`/users/${auth?.id}`} end>
          <ProfileIcon />
          <span>Profile</span>
        </NavLink>
      </MenuItem>
      <MenuItem>
        <NavLink className="m-row" to="/settings">
          <SettingsIcon />
          <span>Settings</span>
        </NavLink>
      </MenuItem>
      <MenuItem className={`m-row${isLoading ? ' disabled' : ''}`} onAction={saveAndlogout}>
        <LogoutIcon />
        <span>Log Out</span>
      </MenuItem>
    </DropdownMenu>
  );
};
