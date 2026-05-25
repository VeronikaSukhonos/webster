import { Link } from 'react-router-dom';

import { MainButton } from '@components/MainButton';
import { DropdownMenu } from '@components/Menu';
import { ProjectMenu, TemplateMenu } from '@components/editor/EditorMenu';

import { DotsIcon, PublicIcon } from '@assets/index';

import { formatDate } from '@utils/utils';

import type { ProjectResponse, TemplateResponse } from '@mytypes/responseTypes';

import './ProjectPreview.css';

interface ProjectPreviewProps {
  project?: ProjectResponse;
  template?: TemplateResponse;
}

const API_ORIGIN = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '').replace(/\/$/, '');
const DEFAULT_PREVIEW = `${API_ORIGIN || window.location.origin}/files/projects/default-preview.jpg`;

export const ProjectPreview = ({ project, template }: ProjectPreviewProps) => {
  return (
    <Link
      to={project ? `/editor?projectId=${project.id}` : `/editor?templateId=${template?.id}`}
      className="project-preview-container"
    >
      <div className="project-preview">
        <div className="image-and-size">
          <img
            src={`${
              project ? project.preview || DEFAULT_PREVIEW : template?.preview || DEFAULT_PREVIEW
            }?t=${new Date()}`}
            alt={
              project
                ? `Project ${project.title}'s preview`
                : `Template ${template?.title}'s preview`
            }
          />
          <DropdownMenu
            button={
              <MainButton className="project-preview-menu" color="white" mini>
                <DotsIcon />
              </MainButton>
            }
          >
            {project && <ProjectMenu project={project} />}
            {template && <TemplateMenu template={template} />}
          </DropdownMenu>
          <p className="size">
            {project ? project.width : template?.width} x{' '}
            {project ? project.height : template?.height}
          </p>
        </div>
        <div className="project-info">
          <div
            className="row ver-center content-title mini"
            style={{ justifyContent: 'space-between' }}
          >
            <span className="t-cut-200">{project ? project.title : template?.title}</span>
            {project && project.isPublic && <PublicIcon />}
          </div>
          {project && (
            <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>
              edited {formatDate(project.editDate)}
            </p>
          )}
          {template && (
            <div className="t-separator" style={{ fontWeight: 500, fontSize: '0.9rem' }}>
              <span className="item" style={{ paddingRight: '6px' }}>
                {template.isBuiltIn ? 'built-in' : 'custom'}
              </span>
              <span className="item">{template.type}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
