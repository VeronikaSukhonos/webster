import type { ProjectResponse, TemplateResponse } from '@mytypes/responseTypes';

interface FormProps {
  isLoading?: boolean;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface FormProjectProps extends FormProps {
  project?: Omit<ProjectResponse, 'file'>;
}

interface FormTemplateProps extends FormProps {
  template?: Omit<TemplateResponse, 'file'>;
}

export const CreateProjectForm = ({
  setIsOpen,
  template,
  isLoading,
  setIsLoading,
}: FormTemplateProps) => {
  return <div>Forms</div>;
};

export const CreateTemplateForm = ({
  setIsOpen,
  project,
  isLoading,
  setIsLoading,
}: FormProjectProps) => {
  return <div>Forms</div>;
};

export const ProjectSettingsForm = ({
  setIsOpen,
  project,
  isLoading,
  setIsLoading,
}: FormProjectProps) => {
  return <div>Forms</div>;
};

export const TemplateSettingsForm = ({
  setIsOpen,
  template,
  isLoading,
  setIsLoading,
}: FormTemplateProps) => {
  return <div>Forms</div>;
};

export const DeletionForm = ({
  setIsOpen,
  project,
  template,
  isLoading,
  setIsLoading,
}: FormProjectProps | FormTemplateProps) => {
  return <div>Forms</div>;
};

export const ExportProjectForm = ({
  setIsOpen,
  project,
  isLoading,
  setIsLoading,
}: FormProjectProps) => {
  return <div>Forms</div>;
};
