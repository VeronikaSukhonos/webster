import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import authApi from '@api/authApi';
import projectsApi from '@api/projectsApi';

import { setAuthUser } from '@store/authSlice';
import { selectEditor, setMode } from '@store/editorSlice';
import { selectUi } from '@store/uiSlice';

import { MainButton } from '@components/MainButton';
import { DropdownMenu, MenuItem } from '@components/Menu';

import { LogoutIcon, ProfileIcon, SettingsIcon } from '@assets/index';

import { useImages } from '@hooks/useImages';
import { useAppDispatch, useAppSelector, useAuth } from '@hooks/utilHooks';

import { exportFile } from '@utils/editorUtils';

import { type CanvasProps, Modes } from '@mytypes/editorTypes';

export const AuthMenu = ({ stageRef, backgroundRef }: Partial<CanvasProps>) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const auth = useAuth();
  const isAvatarLoading = useAppSelector(selectUi.isAvatarLoading);
  const [isLoading, setIsLoading] = useState(false);
  const imagesCtx = useImages();

  const hasUnsavedChanges = useAppSelector(selectEditor.hasUnsavedChanges);
  const canvas = useAppSelector(selectEditor.canvas);
  const project = useAppSelector(selectEditor.project);

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
        setIsLoading(true);
        dispatch(setMode(Modes.Load));

        projectsApi
          .updateProject(project.id, {
            size: { width: canvas.background.width, height: canvas.background.height },
            content: canvas,
            images: imagesCtx?.presentFiles,
            ...(stageRef &&
              backgroundRef && {
                preview: await exportFile({
                  stageRef,
                  backgroundRef,
                  filename: `preview-${project.id}.jpg`,
                  format: 'jpg',
                  height: 300,
                }),
              }),
            editDate: new Date().toISOString(),
          })
          .then(() => {
            logout();
          })
          .catch((err) => {
            dispatch(setMode(Modes.Edit));
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
