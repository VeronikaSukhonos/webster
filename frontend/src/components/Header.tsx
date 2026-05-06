import { Link, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import authApi from '@api/authApi';

import { setAuthUser } from '@store/authSlice';
import { selectUi, setModal } from '@store/uiSlice';

import { MainButton } from '@components/MainButton';
import { DropdownMenu, MenuItem } from '@components/Menu';

import {
  Logo,
  LogoutIcon,
  PlusIcon,
  ProfileIcon,
  ProjectIcon,
  SettingsIcon,
  TemplateIcon,
} from '@assets/index';

import { useAppDispatch, useAppSelector, useAuth } from '@hooks/utilHooks';

import './Header.css';

export const Header = ({ error = false }: { error?: boolean }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const auth = useAuth();
  const isAvatarLoading = useAppSelector(selectUi.isAvatarLoading);

  const logout = () => {
    authApi
      .logout()
      .then(() => {
        dispatch(setAuthUser(null));
        navigate('/login');
      })
      .catch((err) => {
        toast(err.message);
      });
  };

  const createButton = (
    <MainButton onClick={() => dispatch(setModal({ type: 'createProject' }))}>
      <PlusIcon />
      Create
    </MainButton>
  );

  if (error)
    return (
      <header className="header">
        <nav>
          <div className="row all-center">
            <a className="logo logo-error" href="/">
              <Logo />
              <div className="app-name t-art">
                Sket<span>Cherry</span>
              </div>
            </a>
          </div>
        </nav>
      </header>
    );

  return (
    <header className="header">
      <nav>
        <div className="logo-container">
          <Link className="logo" to="/">
            <Logo />
            <div className="app-name t-art">
              Sket<span>Cherry</span>
            </div>
          </Link>
        </div>

        {auth ? (
          <>
            <NavLink className="navlink" to="/projects">
              <ProjectIcon className="tab-icon" />
              <span className="tab-name">Projects</span>
            </NavLink>
            <NavLink className="navlink" to="/templates">
              <TemplateIcon className="tab-icon" />
              <span className="tab-name">Templates</span>
            </NavLink>
            {createButton}
            <DropdownMenu
              button={
                <MainButton
                  color="white"
                  square
                  style={{ borderRadius: '50%' }}
                  aria-label="Account Menu"
                >
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
          </>
        ) : (
          <>
            <NavLink className="navlink" to="/register">
              <span>Register</span>
            </NavLink>
            <NavLink className="navlink" to="/login">
              <span>Log in</span>
            </NavLink>
            {createButton}
          </>
        )}
      </nav>
    </header>
  );
};
