import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import authApi from '@api/authApi';
import projectsApi from '@api/projectsApi';

import { setAuthUser } from '@store/authSlice';
import { clearEditor, selectEditor, setMode } from '@store/editorSlice';
import { selectUi } from '@store/uiSlice';

import { MainButton } from '@components/MainButton';
import { DropdownMenu, MenuItem } from '@components/Menu';

import { LogoutIcon, ProfileIcon, SettingsIcon } from '@assets/index';

import { useImages } from '@hooks/useImages';
import { useAppDispatch, useAppSelector, useAuth } from '@hooks/utilHooks';

export const AuthMenu = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const auth = useAuth();
  const isAvatarLoading = useAppSelector(selectUi.isAvatarLoading);
  const [isLoading, setIsLoading] = useState(false);
  const imagesCtx = useImages();

  const hasUnsavedChanges = useAppSelector(selectEditor.hasUnsavedChanges);
  const canvas = useAppSelector(selectEditor.canvas);
  const project = useAppSelector(selectEditor.project);

  const logout = () => {
    setIsLoading(true);
    authApi
      .logout()
      .then(() => {
        dispatch(setAuthUser(null));
        setIsLoading(false);
        navigate('/login');
      })
      .catch((err) => {
        setIsLoading(false);
        toast(err.message);
      });
  };

  const saveAndlogout = () => {
    if (hasUnsavedChanges && auth && project && project.author.id === auth.id) {
      setIsLoading(true);
      dispatch(setMode('load'));

      projectsApi
        .updateProject(project.id, {
          size: { width: canvas.background.width, height: canvas.background.height },
          content: canvas,
          images: imagesCtx.files,
          editDate: new Date().toISOString(),
        })
        .then(() => {
          dispatch(clearEditor());
          imagesCtx.clearFiles();
          logout();
        })
        .catch((err) => {
          dispatch(setMode('edit'));
          setIsLoading(false);
          toast(err.message);
        });
    } else {
      logout();
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
