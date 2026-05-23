import { Load } from '@components/Load';
import { ProjectPreview } from '@components/projects/ProjectPreview';

import type { ProjectResponse, TemplateResponse } from '@mytypes/responseTypes';
import type { Feedback } from '@mytypes/utilTypes';

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
  if (areProjectsLoading || !projectsFeedback.status) return <Load spinner />;
  if (projectsFeedback.status === 'fail')
    return <p className="feedback t-ital">{projectsFeedback.message}</p>;
  if (
    projectsFeedback.status === 'ok' &&
    ((projects && !projects.length) || (templates && !templates.length))
  )
    return <p className="feedback t-ital">{noDataFeedback}</p>;

  return (
    <div className="col all-center grow">
      <div className="project-list">
        {projects
          ? projects?.map((project) => (
              <ProjectPreview key={project.id} project={project} template={undefined} />
            ))
          : templates?.map((template) => (
              <ProjectPreview key={template.id} project={undefined} template={template} />
            ))}
      </div>
    </div>
  );
};
