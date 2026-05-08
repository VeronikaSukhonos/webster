import { Link, NavLink } from 'react-router-dom';

import { setModal } from '@store/uiSlice';

import { MainButton } from '@components/MainButton';
import { AuthMenu } from '@components/users/AuthMenu';

import { Logo, PlusIcon, ProjectIcon, TemplateIcon } from '@assets/index';

import { useAppDispatch, useAuth } from '@hooks/utilHooks';

import './Header.css';

export const Header = ({ error = false }: { error?: boolean }) => {
  const dispatch = useAppDispatch();

  const auth = useAuth();

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
            <AuthMenu />
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
