import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import authApi from '@api/authApi';

import { setAuthUser } from '@store/authSlice';
// import { resetEditor } from '@store/editorSlice';
import { selectUi } from '@store/uiSlice';

import { MainButton } from '@components/MainButton';
import { DropdownMenu, MenuItem } from '@components/Menu';

import { LogoutIcon, ProfileIcon, SettingsIcon } from '@assets/index';

import { useAppDispatch, useAppSelector, useAuth } from '@hooks/utilHooks';

export const AuthMenu = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const auth = useAuth();
  const isAvatarLoading = useAppSelector(selectUi.isAvatarLoading);

  const logout = () => {
    authApi
      .logout()
      .then(() => {
        dispatch(setAuthUser(null));
        // TODO save project to server if any
        navigate('/login');
        // dispatch(resetEditor());
      })
      .catch((err) => {
        toast(err.message);
      });
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
      <MenuItem className="m-row" onAction={logout}>
        <LogoutIcon />
        <span>Log Out</span>
      </MenuItem>
    </DropdownMenu>
  );
};
