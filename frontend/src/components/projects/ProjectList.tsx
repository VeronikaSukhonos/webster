import { Load } from '@components/Load';

import type { ProjectResponse, TemplateResponse } from '@mytypes/responseTypes';
import type { Feedback } from '@mytypes/utilTypes';

import { ProjectPreview } from './ProjectPreview';

import './ProjectList.css';

interface ProjectListProps {
  projects?: ProjectResponse[];
  templates?: TemplateResponse[];
  areProjectsLoading: boolean;
  projectsFeedback: Feedback;
  noDataFeedback?: string;
}

export const ProjectList = ({
  projects,
  templates,
  areProjectsLoading,
  projectsFeedback,
  noDataFeedback,
}: ProjectListProps) => {
  // component should take all available space vertically so that pagination would be pushed down
  if (areProjectsLoading || !projectsFeedback.status) return <Load spinner={true} />;
  if (projectsFeedback.status === 'fail')
    return <p className="feedback center">{projectsFeedback.message}</p>;
  if (projectsFeedback.status === 'ok' && ((projects && !projects.length) || (templates && !templates.length)))
    return <p className="feedback center">{noDataFeedback}</p>;

  return (
    <div className="project-list">
      {projects ? projects?.map((project) => (
        <ProjectPreview key={project.id} project={project} template={undefined} />
      )) : templates?.map((template) => (
        <ProjectPreview key={template.id} project={undefined} template={template} />
      ))}
    </div>
  );
};
