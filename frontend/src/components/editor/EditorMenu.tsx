import type { ProjectResponse, TemplateResponse } from '@mytypes/responseTypes';

export const ProjectMenu = ({ project }: { project: ProjectResponse }) => {
  return <div>Menu TODO {JSON.stringify(project)}</div>;
};

export const TemplateMenu = ({ template }: { template: TemplateResponse }) => {
  return <div>Menu TODO {JSON.stringify(template)}</div>;
};
