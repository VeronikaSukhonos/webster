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

export const ProjectPreview = ({ project, template }: ProjectPreviewProps) => {
  return (
    <Link to={project ? `/editor?projectId=${project.id}` : `/editor?templateId=${template?.id}`}>
      <div className="project-preview">
        <div className="image-and-size">
          <img
            src={
              project
                ? project.preview === ''
                  ? 'http://localhost:3000/files/projects/default-preview.jpg'
                  : project.preview
                : template?.preview === ''
                  ? 'http://localhost:3000/files/projects/default-preview.jpg'
                  : template?.preview
            }
            alt={
              project
                ? `Project ${project.title}'s preview`
                : `Template ${template?.title}'s preview`
            }
          />
          <DropdownMenu
            button={
              <MainButton className="project-preview-menu" color="white" mini={true}>
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
          <div className="project-name">
            <p className="title">{project ? project.title : template?.title}</p>
            {project && project.isPublic && <PublicIcon />}
          </div>
          {project && <p>edited {formatDate(project.editDate)}</p>}
          {template && (
            <p>
              {template.isBuiltIn ? 'built-in' : 'custom'} ・ {template.type}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};
