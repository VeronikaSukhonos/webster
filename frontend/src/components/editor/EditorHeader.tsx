import { Link } from 'react-router-dom';

import { selectEditor } from '@store/editorSlice';

import { MainButton } from '@components/MainButton';
import { Menu, Popover } from '@components/Menu';
import { ProjectMenu, TemplateMenu } from '@components/editor/EditorMenu';
import { HistoryButtons, buttonProps } from '@components/editor/HistoryButtons';
import { ShareMenu } from '@components/editor/ShareMenu';
import { AuthMenu } from '@components/users/AuthMenu';

import { HomeIcon, InfoIcon, LoginIcon, ProjectIcon, PublicIcon, ShareIcon } from '@assets/index';

import { useAppSelector, useAuth } from '@hooks/utilHooks';

import { formatDate } from '@utils/utils';

import { type CanvasProps, Modes } from '@mytypes/editorTypes';

import './EditorHeader.css';

export const EditorHeader = ({ stageRef, backgroundRef }: CanvasProps) => {
  const auth = useAuth();

  const project = useAppSelector(selectEditor.project);
  const template = useAppSelector(selectEditor.template);
  const mode = useAppSelector(selectEditor.mode);

  return (
    <header className="editor-header">
      <nav>
        <MainButton to="/" {...buttonProps} aria-label="Home" tooltipId="home">
          <HomeIcon />
        </MainButton>

        <Popover
          button={
            <MainButton
              {...buttonProps}
              aria-label={`${template ? 'Template' : 'Project'} information`}
              tooltipId="info"
            >
              <InfoIcon />
            </MainButton>
          }
          className="col mini-gap"
        >
          <div>
            <div
              className="row ver-center content-title mini"
              style={{ justifyContent: 'space-between' }}
            >
              <span>{project?.title || template?.title}</span>
              {project?.isPublic && <PublicIcon />}
            </div>
            {project?.author && (
              <div
                className="t-separator"
                style={{ display: 'flex', flexWrap: 'wrap', fontSize: '0.95rem' }}
              >
                <div className="item t-cut-300">
                  by{' '}
                  <Link
                    className="link blue"
                    style={{ paddingRight: '6px' }}
                    to={`/users/${project?.author?.id.toString()}`}
                    target="blank"
                  >
                    {project?.author?.username}
                  </Link>
                </div>
                <div className="item">{formatDate(project?.editDate || '')}</div>
              </div>
            )}
            {template?.isBuiltIn !== undefined && (
              <div
                className="t-separator"
                style={{ display: 'flex', flexWrap: 'wrap', fontSize: '0.95rem' }}
              >
                <div className="item" style={{ paddingRight: '6px' }}>
                  {template.isBuiltIn ? 'built-in' : 'custom'}
                </div>
                <div className="item">{formatDate(template?.createDate || '')}</div>
              </div>
            )}
          </div>
          {project?.description && (
            <>
              <hr />
              <div style={{ fontSize: '0.95rem', fontStyle: 'italic' }}>{project.description}</div>
            </>
          )}
          {template?.type && (
            <>
              <hr />
              <div style={{ fontSize: '0.95rem', fontStyle: 'italic' }}>{template.type}</div>
            </>
          )}
          <hr />
          <div style={{ fontWeight: '700' }}>
            {project?.width || template?.width} x {project?.height || template?.height} pixels
          </div>
          {project?.template && (
            <div className="t-cut-300" style={{ fontSize: '0.95rem' }}>
              based on{' '}
              <Link
                className="link blue"
                to={`/editor?templateId=${project.template.id.toString()}`}
                target="blank"
              >
                {project.template.title}
              </Link>
            </div>
          )}
        </Popover>

        {(project || template) && (
          <Popover
            button={
              <MainButton
                {...buttonProps}
                aria-label={`${template ? 'Template' : 'Project'} actions`}
                tooltipId={project ? 'project' : 'template'}
              >
                <ProjectIcon />
              </MainButton>
            }
          >
            <Menu>
              {project && <ProjectMenu project={project} />}
              {template && <TemplateMenu template={template} />}
            </Menu>
          </Popover>
        )}

        <h1 className="content-title">
          <span className="t-cut-300">{project?.title || template?.title}</span>
        </h1>

        {mode !== Modes.View && <HistoryButtons />}
        {auth ? (
          <>
            {project && auth.id === project.author?.id && (
              <Popover
                button={
                  <MainButton {...buttonProps} aria-label="Share" tooltipId="share">
                    <ShareIcon />
                  </MainButton>
                }
              >
                <ShareMenu stageRef={stageRef} backgroundRef={backgroundRef} />
              </Popover>
            )}
            <AuthMenu stageRef={stageRef} backgroundRef={backgroundRef} />
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
