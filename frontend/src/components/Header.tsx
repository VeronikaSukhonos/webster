import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import authApi from '@api/authApi';

import { setAuthUser } from '@store/authSlice';
import { selectUi, setModal } from '@store/uiSlice';

import { Dropdown } from '@components/Dropdown';
import { MainButton } from '@components/MainButton';

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

export const Header = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const auth = useAuth();
  const isAvatarLoading = useAppSelector(selectUi.isAvatarLoading);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);

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
    <MainButton
      content={
        <>
          <PlusIcon />
          Create
        </>
      }
      onClick={() => dispatch(setModal({ type: 'createProject' }))}
    />
  );

  return (
    <header className="header">
      <nav>
        <Link className="logo" to="/">
          <Logo />
          <div className="app-name t-art">
            Sket<span>Cherry</span>
          </div>
        </Link>

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
            <Dropdown
              isOpen={isAuthMenuOpen}
              setIsOpen={setIsAuthMenuOpen}
              button={
                <MainButton
                  content={
                    <img
                      className={'auth-avatar' + (isAvatarLoading ? ' img-load' : '')}
                      src={auth?.avatar}
                      alt="My avatar"
                    />
                  }
                  onClick={() => setIsAuthMenuOpen((open: boolean) => !open)}
                  color="white"
                  square
                  style={{ borderRadius: '50%' }}
                />
              }
              items={[
                <NavLink className="navlink" to={`/users/${auth?.id}`} end>
                  <ProfileIcon />
                  <span>Profile</span>
                </NavLink>,
                <NavLink className="navlink" to="/settings">
                  <SettingsIcon />
                  <span>Settings</span>
                </NavLink>,
                <button className="navlink" type="button" onClick={logout}>
                  <LogoutIcon />
                  <span>Log Out</span>
                </button>,
              ]}
            />
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
