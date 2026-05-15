import { selectEditor } from '@store/editorSlice';

import { MainButton } from '@components/MainButton';
import { Popover } from '@components/Menu';
import { HistoryButtons, buttonProps } from '@components/editor/HistoryButtons';
import { AuthMenu } from '@components/users/AuthMenu';

import { HomeIcon, InfoIcon, LoginIcon, ProjectIcon, ShareIcon } from '@assets/index';

import { useAppSelector, useAuth } from '@hooks/utilHooks';

import './EditorHeader.css';

export const EditorHeader = () => {
  const auth = useAuth();

  const title = useAppSelector(selectEditor.title);
  const project = useAppSelector(selectEditor.project);
  const template = useAppSelector(selectEditor.template);
  const mode = useAppSelector(selectEditor.mode);

  return (
    <header className="editor-header">
      <nav>
        <MainButton to="/" {...buttonProps} aria-label="Home">
          <HomeIcon />
        </MainButton>

        <Popover
          button={
            <MainButton
              {...buttonProps}
              aria-label={`${template ? 'Template' : 'Project'} information`}
            >
              <InfoIcon />
            </MainButton>
          }
        >
          TODO
        </Popover>

        <Popover
          button={
            <MainButton
              {...buttonProps}
              aria-label={`${template ? 'Template' : 'Project'} actions`}
            >
              <ProjectIcon />
            </MainButton>
          }
        >
          TODO
        </Popover>

        <h1 className="content-title">
          <span>{title}</span>
        </h1>

        {mode === 'edit' && <HistoryButtons />}
        {auth ? (
          <>
            {project && auth.id === project.author.id && (
              <Popover
                button={
                  <MainButton {...buttonProps} aria-label="Share">
                    <ShareIcon />
                  </MainButton>
                }
              >
                TODO
              </Popover>
            )}
            <AuthMenu />
          </>
        ) : (
          <MainButton to="/login" {...buttonProps} aria-label="Log in">
            <LoginIcon />
          </MainButton>
        )}
      </nav>
    </header>
  );
};
