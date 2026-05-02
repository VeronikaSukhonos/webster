import type { ProjectResponse, TemplateResponse } from '@mytypes/responseTypes';

interface FormProps {
  isLoading?: boolean;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
}

interface FormProjectProps extends FormProps {
  project?: Omit<ProjectResponse, 'file'>;
}

interface FormTemplateProps extends FormProps {
  template?: Omit<TemplateResponse, 'file'>;
}

export const CreateProjectForm = ({ template, isLoading, setIsLoading }: FormTemplateProps) => {
  return <div>Forms</div>;
};

export const CreateTemplateForm = ({ project, isLoading, setIsLoading }: FormProjectProps) => {
  return <div>Forms</div>;
};

export const ProjectSettingsForm = ({ project, isLoading, setIsLoading }: FormProjectProps) => {
  return <div>Forms</div>;
};

export const TemplateSettingsForm = ({ template, isLoading, setIsLoading }: FormTemplateProps) => {
  return <div>Forms</div>;
};

export const DeletionForm = ({
  project,
  template,
  isLoading,
  setIsLoading,
}: FormProjectProps | FormTemplateProps) => {
  return <div>Forms</div>;
};

export const ExportProjectForm = ({ project, isLoading, setIsLoading }: FormProjectProps) => {
  return <div>Forms</div>;
};
