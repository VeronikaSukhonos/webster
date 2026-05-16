import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import projectsApi from '@api/projectsApi';
import templatesApi from '@api/templatesApi';

import { setProject } from '@store/editorSlice';

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

import { useForm } from '@hooks/useForm';
import { useImages } from '@hooks/useImages';
import { useAppDispatch, useAuth } from '@hooks/utilHooks';

import { MAX_CANVAS_SIZE, MIN_CANVAS_SIZE, SIZE_TYPES } from '@utils/constants';
import { createLocalImageItem, getInitCanvasSize, initCanvas } from '@utils/editorUtils';

import type { Size } from '@mytypes/editorTypes';
import { type CreateProjectParams, createProjectParams } from '@mytypes/formParams';
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

const SIZE_TYPE_OPTIONS = SIZE_TYPES.map((opt) => ({
  value: { width: opt.width, height: opt.height },
  label:
    opt.width && opt.height ? (
      <SelectLabel label={opt.width + ' x ' + opt.height} more={opt.proportion} />
    ) : (
      <SelectLabel label="Custom" />
    ),
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
            dispatch(setProject({ project: res.data.project, mode: 'edit' }));
            redirect(res.data.project.id);
          })
          .catch(handleError);
      } else {
        dispatch(setProject({ project: { title: params.title, content }, mode: 'edit' }));
        redirect();
      }
    } else if (createProject.params.type === 'template' && template) {
      if (!createProject.params.image) clearImages();
      setIsLoading?.(true);
      if (auth) {
        projectsApi
          .createProjectFromTemplate(template.id, { title: params.title })
          .then(({ data: res }) => {
            dispatch(setProject({ project: res.data.project, mode: 'edit' }));
            redirect(res.data.project.id);
          })
          .catch(handleError);
      } else {
        templatesApi
          .getTemplate(template.id)
          .then(({ data: res }) => {
            dispatch(
              setProject({
                project: { title: params.title, content: res.data.template.content },
                mode: 'edit',
              }),
            );
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
              dispatch(setProject({ project: res.data.project, mode: 'edit' }));
              imagesCtx.replaceImageItems(res.data.project.images, true);
              clearImages();
              redirect(res.data.project.id);
            })
            .catch(handleError);
        } else {
          dispatch(setProject({ project: { title: params.title, content }, mode: 'edit' }));
          imagesCtx.addLocalImageItems(params.image);
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
            <SelectLabel label={template.title} more={template.width + ' x ' + template.height} />
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

export const CreateTemplateForm = (
  {
    // setIsOpen,
    // project,
    // isLoading,
    // setIsLoading,
  }: FormProjectProps,
) => {
  return <div>Forms</div>;
};

export const ProjectSettingsForm = (
  {
    // setIsOpen,
    // project,
    // isLoading,
    // setIsLoading,
  }: FormProjectProps,
) => {
  return <div>Forms</div>;
};

export const TemplateSettingsForm = (
  {
    // setIsOpen,
    // template,
    // isLoading,
    // setIsLoading,
  }: FormTemplateProps,
) => {
  return <div>Forms</div>;
};

export const DeletionForm = (
  {
    // setIsOpen,
    // project,
    // template,
    // isLoading,
    // setIsLoading,
  }: FormProjectProps | FormTemplateProps,
) => {
  return <div>Forms</div>;
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
