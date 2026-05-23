import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import projectsApi from '@api/projectsApi';
import templatesApi from '@api/templatesApi';

import { setProject } from '@store/editorSlice';
import {
  setProjectToDelete,
  setProjectToUpdate,
  setTemplateToDelete,
  setTemplateToUpdate,
} from '@store/uiSlice';

import { Feedback } from '@components/Feedback';
import {
  ImageField,
  SelectField,
  SelectLabel,
  SizeField,
  TextField,
} from '@components/InputFields';
import { MainButton } from '@components/MainButton';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@components/Tabs';

import { LinkIcon } from '@assets/index';

import { useForm } from '@hooks/useForm';
import { useImages } from '@hooks/useImages';
import { useAppDispatch, useAuth } from '@hooks/utilHooks';

import {
  MAX_CANVAS_SIZE,
  MIN_CANVAS_SIZE,
  SIZE_TYPES,
  TEMPLATE_TYPES,
  VISIBILITY_TYPES,
} from '@utils/constants';
import { createLocalImageItem, getInitCanvasSize, initCanvas } from '@utils/editorUtils';
import { copyLink } from '@utils/utils';

import { Modes, type Size } from '@mytypes/editorTypes';
import {
  type CreateProjectParams,
  type ProjectSettingsParams,
  type TemplateParams,
  createProjectParams,
  deleteParams,
  projectSettingsParams,
  templateParams,
} from '@mytypes/formParams';
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

interface CreateProjectFormProps extends FormTemplateProps {
  setOnOpenChange: React.Dispatch<React.SetStateAction<(() => void) | undefined>>;
}

interface FormDeleteProps extends FormProjectProps, FormTemplateProps {}

const SIZE_TYPE_OPTIONS = SIZE_TYPES.map((opt) => ({
  value: { width: opt.width, height: opt.height },
  label:
    opt.width && opt.height ? (
      <SelectLabel more={opt.proportion}>{opt.width + ' x ' + opt.height}</SelectLabel>
    ) : (
      <SelectLabel>Custom</SelectLabel>
    ),
}));

const TEMPLATE_TYPE_OPTIONS = [
  {
    value: 'select-type',
    label: <SelectLabel>Select type</SelectLabel>,
  },
];
for (const i of TEMPLATE_TYPES) {
  TEMPLATE_TYPE_OPTIONS.push({
    value: i.value,
    label: <SelectLabel>{i.label}</SelectLabel>,
  });
}

const VISIBILITY_TYPE_OPTIONS = VISIBILITY_TYPES.map((opt) => ({
  value: opt.value,
  label: <SelectLabel>{opt.label}</SelectLabel>,
}));

export const CreateProjectForm = ({
  setIsOpen,
  template,
  isLoading,
  setIsLoading,
  setOnOpenChange,
}: CreateProjectFormProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const auth = useAuth();
  const imagesCtx = useImages();

  const createProject = useForm(
    createProjectParams,
    {
      title: '',
      type: template ? 'template' : 'blank',
      size: { width: null, height: null },
      image: [],
    },
    true,
  );
  const [sizeType, setSizeType] = useState(SIZE_TYPE_OPTIONS[0].value);
  const [forceProportion, setForceProportion] = useState<number | undefined>(undefined);

  const clearImages = () => {
    for (const img of createProject.params.image) URL.revokeObjectURL(img.url);
    createProject.setParam({ target: { name: 'image', value: [] } });
  };

  useEffect(() => {
    setOnOpenChange(() => clearImages);
  }, []);

  useEffect(() => {
    if (sizeType.width && sizeType.height) {
      setForceProportion(sizeType.height / sizeType.width);
    } else {
      setForceProportion(undefined);
    }
  }, [sizeType]);

  useEffect(() => {
    if (forceProportion && sizeType.width && sizeType.height)
      createProject.setParam({ target: { name: 'size', value: sizeType } });
  }, [sizeType, forceProportion]);

  const redirect = (id?: number) => {
    createProject.setSuccess({ message: 'Created project successfully' });
    setIsLoading?.(false);
    navigate(id ? `/editor?projectId=${id}` : '/editor');
    setIsOpen(false);
  };

  const handleError = (err: any) => {
    createProject.setFailure(err);
    setIsLoading?.(false);
  };

  const submit = (params: CreateProjectParams) => {
    if (createProject.params.type === 'blank') {
      const content = initCanvas(params.size as Size);

      if (!createProject.params.image) clearImages();
      if (auth) {
        setIsLoading?.(true);
        projectsApi
          .createProject({ title: params.title, size: params.size as Size, content })
          .then(({ data: res }) => {
            dispatch(setProject({ project: res.data.project, mode: Modes.Edit }));
            redirect(res.data.project.id);
          })
          .catch(handleError);
      } else {
        dispatch(
          setProject({
            project: {
              title: params.title,
              content,
              width: params.size.width as number,
              height: params.size.height as number,
            },
            mode: Modes.Edit,
          }),
        );
        redirect();
      }
    } else if (createProject.params.type === 'template' && template) {
      if (!createProject.params.image) clearImages();
      setIsLoading?.(true);
      if (auth) {
        projectsApi
          .createProjectFromTemplate(template.id, { title: params.title })
          .then(({ data: res }) => {
            dispatch(setProject({ project: res.data.project, mode: Modes.Edit }));
            imagesCtx?.replaceImageItems(res.data.project.images, true);
            redirect(res.data.project.id);
          })
          .catch(handleError);
      } else {
        templatesApi
          .getTemplate(template.id)
          .then(({ data: res }) => {
            dispatch(
              setProject({
                project: {
                  title: params.title,
                  content: res.data.template.content,
                  width: template.width,
                  height: template.height,
                },
                mode: Modes.Edit,
              }),
            );
            imagesCtx?.replaceImageItems(res.data.template.images, true);
            redirect();
          })
          .catch(handleError);
      }
    } else if (createProject.params.type === 'upload') {
      const img = new Image();

      setIsLoading?.(true);
      img.src = params.image[0].url;
      img.onload = () => {
        const size = getInitCanvasSize(img);
        const content = initCanvas(size, params.image[0]);

        if (auth) {
          projectsApi
            .createProject({ title: params.title, size, content, uploads: params.image })
            .then(({ data: res }) => {
              dispatch(setProject({ project: res.data.project, mode: Modes.Edit }));
              imagesCtx?.replaceImageItems(res.data.project.images, true);
              clearImages();
              redirect(res.data.project.id);
            })
            .catch(handleError);
        } else {
          dispatch(
            setProject({
              project: { title: params.title, content, width: size.width, height: size.height },
              mode: Modes.Edit,
            }),
          );
          imagesCtx?.addLocalImageItems(params.image);
          redirect();
        }
      };
    }
  };

  return (
    <form className="col f-container" onSubmit={createProject.handleSubmit(submit)}>
      <TextField label="Title" {...createProject.setField('title')} required />

      {template ? (
        <div className="field">
          <span className="field-label">From Template</span>
          <div className="field-container selected" style={{ fontWeight: 800, padding: '0 10px' }}>
            <SelectLabel more={template.width + ' x ' + template.height}>
              {template.title}
            </SelectLabel>
          </div>
        </div>
      ) : (
        <Tabs
          onSelectionChange={(value) => createProject.setParam({ target: { name: 'type', value } })}
        >
          <TabList>
            <Tab id="blank">Blank</Tab>
            <Tab id="upload">Upload</Tab>
          </TabList>
          <TabPanels>
            <TabPanel id="blank" className="col">
              <SelectField
                name="size-type"
                value={sizeType}
                onChange={(e) => setSizeType(e.target.value)}
                options={SIZE_TYPE_OPTIONS}
                label="Size"
              />
              <SizeField
                {...createProject.setField('size')}
                min={MIN_CANVAS_SIZE}
                max={MAX_CANVAS_SIZE}
                innerLabels
                required
                forceProportion={forceProportion}
                disabled={!!forceProportion}
              />
            </TabPanel>
            <TabPanel id="upload">
              <ImageField
                name="image"
                value={createProject.params.image}
                onChange={(e) =>
                  createProject.setParam({
                    target: { ...e.target, value: [createLocalImageItem(e.target.value[0], true)] },
                  })
                }
                onDelete={(e) =>
                  createProject.setParam(
                    (() => {
                      URL.revokeObjectURL(
                        createProject.params.image.find((i) => i.id === e.target.value).url,
                      );

                      return {
                        target: {
                          ...e.target,
                          value: createProject.params.image.filter((i) => i.id !== e.target.value),
                        },
                      };
                    })(),
                  )
                }
                error={createProject.errors.image}
                maxFiles={1}
                label="Image"
                required
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}

      <Feedback feedback={createProject.feedback} />

      <MainButton type="submit" disabled={isLoading || createProject.isLoading} upperText wide>
        Create
      </MainButton>
    </form>
  );
};

export const CreateTemplateForm = ({
  setIsOpen,
  project,
  isLoading,
  setIsLoading,
}: FormProjectProps) => {
  const navigate = useNavigate();

  const auth = useAuth();

  const createTemplate = useForm(
    templateParams,
    {
      title: project?.title as string,
      type: 'select-type' as any,
    },
    true,
  );
  const [templateType, setTemplateType] = useState(TEMPLATE_TYPE_OPTIONS[0].value);

  useEffect(() => {
    createTemplate.setParam({ target: { name: 'type', value: templateType } });
  }, [templateType]);

  const redirect = (type: string) => {
    createTemplate.setSuccess({ message: 'Created template successfully' });
    setIsLoading?.(false);
    navigate(`/templates?source=custom&type=${type}`);
    setIsOpen(false);
  };

  const handleError = (err: any) => {
    createTemplate.setFailure(err);
    setIsLoading?.(false);
  };

  const submit = (params: TemplateParams) => {
    if (auth) {
      setIsLoading?.(true);
      templatesApi
        .createTemplateFromProject(project?.id as number, {
          title: params.title,
          type: params.type,
        })
        .then(({ data: res }) => {
          redirect(res.data.template.type);
        })
        .catch(handleError);
    }
  };

  return (
    <form className="col f-container" onSubmit={createTemplate.handleSubmit(submit)}>
      <TextField label="Title" {...createTemplate.setField('title')} required />

      <SelectField
        name="template-type"
        value={templateType}
        onChange={(e) => setTemplateType(e.target.value)}
        options={TEMPLATE_TYPE_OPTIONS}
        label="Type"
        error={createTemplate.errors.type}
      />

      <div className="field">
        <span className="field-label">From Project</span>
        <div className="field-container selected" style={{ fontWeight: 800, padding: '0 10px' }}>
          <SelectLabel more={project?.width + ' x ' + project?.height}>
            {project?.title}
          </SelectLabel>
        </div>
      </div>

      <Feedback feedback={createTemplate.feedback} />

      <MainButton type="submit" disabled={isLoading || createTemplate.isLoading} upperText wide>
        Create
      </MainButton>
    </form>
  );
};

export const ProjectSettingsForm = ({
  setIsOpen,
  project,
  isLoading,
  setIsLoading,
}: FormProjectProps) => {
  const dispatch = useAppDispatch();

  const auth = useAuth();

  const editProjectSettings = useForm(
    projectSettingsParams,
    {
      title: project?.title as string,
      description: project?.description,
      visibility: project?.isPublic ? 'everyone' : 'me',
    },
    true,
  );
  const [visibilityType, setVisibilityType] = useState(
    VISIBILITY_TYPE_OPTIONS[Number(project?.isPublic)].value,
  );

  useEffect(() => {
    if (visibilityType)
      editProjectSettings.setParam({ target: { name: 'visibility', value: visibilityType } });
  }, [visibilityType]);

  const handleError = (err: any) => {
    editProjectSettings.setFailure(err);
    setIsLoading?.(false);
  };

  const submit = (params: ProjectSettingsParams) => {
    if (auth) {
      setIsLoading?.(true);
      projectsApi
        .updateProject(project?.id as number, {
          title: params.title,
          description: params.description,
          isPublic: params.visibility === 'everyone' ? true : false,
          editDate: new Date().toISOString(),
        })
        .then(() => {
          dispatch(setProjectToUpdate(project?.id as number));
          setIsLoading?.(false);
          setIsOpen?.(false);
        })
        .catch(handleError);
    }
  };

  return (
    <form className="col f-container" onSubmit={editProjectSettings.handleSubmit(submit)}>
      <TextField label="Title" {...editProjectSettings.setField('title')} />

      <TextField label="Description" {...editProjectSettings.setField('description')} area />

      <div className="row">
        <SelectField
          name="visibility-type"
          value={visibilityType}
          onChange={(e) => setVisibilityType(e.target.value)}
          options={VISIBILITY_TYPE_OPTIONS}
          label="Visibility"
        />
        {visibilityType === 'everyone' && (
          <MainButton
            color="white"
            onClick={() => copyLink(window.location.origin, project?.id as number)}
            style={{ alignSelf: 'flex-end' }}
          >
            <LinkIcon />
          </MainButton>
        )}
      </div>

      <Feedback feedback={editProjectSettings.feedback} />

      <MainButton
        type="submit"
        disabled={isLoading || editProjectSettings.isLoading}
        upperText
        wide
      >
        Save
      </MainButton>
    </form>
  );
};

export const TemplateSettingsForm = ({
  setIsOpen,
  template,
  isLoading,
  setIsLoading,
}: FormTemplateProps) => {
  const dispatch = useAppDispatch();

  const auth = useAuth();

  const editTemplateSettings = useForm(
    templateParams,
    {
      title: template?.title as string,
      type: 'select-type' as any,
    },
    true,
  );
  const [templateType, setTemplateType] = useState(template?.type);

  useEffect(() => {
    if (templateType)
      editTemplateSettings.setParam({ target: { name: 'type', value: templateType } });
  }, [templateType]);

  const handleError = (err: any) => {
    editTemplateSettings.setFailure(err);
    setIsLoading?.(false);
  };

  const submit = (params: TemplateParams) => {
    if (auth) {
      setIsLoading?.(true);
      templatesApi
        .updateTemplate(template?.id as number, { title: params.title, type: params.type })
        .then(() => {
          dispatch(setTemplateToUpdate(template?.id as number));
          setIsLoading?.(false);
          setIsOpen?.(false);
        })
        .catch(handleError);
    }
  };

  return (
    <form className="col f-container" onSubmit={editTemplateSettings.handleSubmit(submit)}>
      <TextField label="Title" {...editTemplateSettings.setField('title')} />

      <SelectField
        name="template-type"
        value={templateType}
        onChange={(e) => setTemplateType(e.target.value)}
        options={TEMPLATE_TYPE_OPTIONS}
        label="Type"
        error={editTemplateSettings.errors.type}
      />

      <Feedback feedback={editTemplateSettings.feedback} />

      <MainButton
        type="submit"
        disabled={isLoading || editTemplateSettings.isLoading}
        upperText
        wide
      >
        Save
      </MainButton>
    </form>
  );
};

export const DeletionForm = ({
  setIsOpen,
  project,
  template,
  isLoading,
  setIsLoading,
}: FormDeleteProps) => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const auth = useAuth();
  const navigate = useNavigate();

  const deleteProjectTemplate = useForm(
    deleteParams,
    {
      title: '',
      expectedTitle: project ? project?.title : template?.title,
    },
    true,
  );

  const handleError = (err: any) => {
    deleteProjectTemplate.setFailure(err);
    setIsLoading?.(false);
  };

  const submit = () => {
    if (auth) {
      setIsLoading?.(true);
      if (project) {
        projectsApi
          .deleteProject(project.id)
          .then(() => {
            deleteProjectTemplate.setSuccess({ message: 'Deleted project successfully' });
            dispatch(setProjectToDelete(project.id));
            setIsLoading?.(false);
            setIsOpen?.(false);
            if (location.pathname.includes('editor')) navigate('/');
          })
          .catch(handleError);
      } else {
        templatesApi
          .deleteTemplate(template?.id as number)
          .then(() => {
            deleteProjectTemplate.setSuccess({ message: 'Deleted template successfully' });
            dispatch(setTemplateToDelete(template?.id as number));
            setIsLoading?.(false);
            setIsOpen?.(false);
            if (location.pathname.includes('editor')) navigate('/');
          })
          .catch(handleError);
      }
    }
  };

  return (
    <form className="col f-container" onSubmit={deleteProjectTemplate.handleSubmit(submit)}>
      <p className="field-error">
        You are about to delete this {project ? 'project' : 'template'}. If you are sure about it,
        please enter the {project ? 'project' : 'template'} title below. All data associated with it
        will be deleted permanently. You cannot undo this action.
      </p>
      <TextField label="Title" {...deleteProjectTemplate.setField('title')} required />

      <Feedback feedback={deleteProjectTemplate.feedback} />

      <MainButton
        type="submit"
        disabled={isLoading || deleteProjectTemplate.isLoading}
        upperText
        wide
      >
        Delete
      </MainButton>
    </form>
  );
};

export const ExportProjectForm = (
  {
    // setIsOpen,
    // project,
    // isLoading,
    // setIsLoading,
  }: FormProjectProps,
) => {
  return <div>Forms</div>;
};
