import type { ProjectResponse } from '@mytypes/responseTypes';
import type { Feedback } from '@mytypes/utilTypes';

interface ProjectListProps {
  projects: ProjectResponse[];
  areProjectsLoading: boolean;
  projectsFeedback: Feedback;
}

export const ProjectList = ({
  projects,
  areProjectsLoading,
  projectsFeedback,
}: ProjectListProps) => {
  // component should take all available space vertically so that pagination would be pushed down
  return <div>ProjectList {JSON.stringify(projects)} {areProjectsLoading} {JSON.stringify(projectsFeedback)}</div>;
};
