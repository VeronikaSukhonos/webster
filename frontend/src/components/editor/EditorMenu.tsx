import type { Project, Template } from '@store/editorSlice';

export const ProjectMenu = ({ project }: { project: Project }) => {
  return <div>Menu TODO {JSON.stringify(project)}</div>;
};

export const TemplateMenu = ({ template }: { template: Template }) => {
  return <div>Menu TODO {JSON.stringify(template)}</div>;
};
