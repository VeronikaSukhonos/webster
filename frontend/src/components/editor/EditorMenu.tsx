import { toast } from 'react-toastify';

// import type Konva from 'konva';

import ProjectsApi from '@api/projectsApi';

import { type Project, type Template, selectEditor } from '@store/editorSlice';
import { setModal, setProjectToDuplicate } from '@store/uiSlice';

import { MenuItem } from '@components/Menu';

import {
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  LinkIcon,
  ProjectIcon,
  TemplateIcon,
} from '@assets/index';

import { useAppDispatch, useAppSelector, useAuth } from '@hooks/utilHooks';

import { copyLink } from '@utils/utils';

import type { Canvas, ImageItem } from '@mytypes/editorTypes';
import type { ProjectResponse } from '@mytypes/responseTypes';

export const ProjectMenu = ({
  project,
  // stageRef,
  // backgroundRef,
  content,
  images = [],
  stageX = 0,
  stageY = 0,
  onSave,
  allowExport = false,
}: {
  project: Project;
  // stageRef?: React.RefObject<Konva.Stage | null>;
  // backgroundRef?: React.RefObject<Konva.Rect | null>;
  content?: Canvas;
  images?: ImageItem[];
  stageX?: number;
  stageY?: number;
  onSave?: () => void | Promise<unknown>;
  allowExport?: boolean;
}) => {
  const auth = useAuth();
  const dispatch = useAppDispatch();

  const editorProject = useAppSelector(selectEditor.project);

  const duplicateProject = async function () {
    if (project) {
      ProjectsApi.duplicateProject(project.id as number)
        .then(({ data: res }) => {
          toast(res.message);
          dispatch(setProjectToDuplicate(res.data.project.id as number));
        })
        .catch((err) => {
          toast(err.message);
        });
    }
  };

  return (
    <>
      {editorProject && auth && editorProject.author?.id === auth?.id && (
        <MenuItem aria-label="Save">
          <div
            className="m-row"
            onClick={() => {
              if (onSave) onSave();
            }}
          >
            <ProjectIcon />
            <span>Save</span>
          </div>
        </MenuItem>
      )}
      {allowExport && (
        <MenuItem aria-label="Export">
          <div
            className="m-row"
            onClick={() =>
              dispatch(
                setModal({
                  type: 'exportProject',
                  project: project as Omit<ProjectResponse, 'file' | 'images' | 'content'>,
                  // stageRef,
                  // backgroundRef,
                  content,
                  images,
                  stageX,
                  stageY,
                }),
              )
            }
          >
            <DownloadIcon />
            <span>Export</span>
          </div>
        </MenuItem>
      )}
      {auth && auth.id === project.author?.id && (
        <MenuItem aria-label="Settings">
          <div
            className="m-row"
            onClick={() =>
              dispatch(
                setModal({
                  type: 'projectSettings',
                  project: project as Omit<ProjectResponse, 'file' | 'images' | 'content'>,
                }),
              )
            }
          >
            <EditIcon />
            <span>Edit settings</span>
          </div>
        </MenuItem>
      )}
      {project.isPublic && (
        <MenuItem aria-label="Copy">
          <div
            className="m-row"
            onClick={() => copyLink(window.location.href, project?.id as number)}
          >
            <LinkIcon />
            <span>Copy link</span>
          </div>
        </MenuItem>
      )}
      {auth && auth.id === project.author?.id && (
        <MenuItem aria-label="Duplicate">
          <div className="m-row" onClick={duplicateProject}>
            <CopyIcon />
            <span>Duplicate</span>
          </div>
        </MenuItem>
      )}
      {auth && auth.id === project.author?.id && (
        <MenuItem className="Template">
          <div
            className="m-row"
            onClick={() =>
              dispatch(
                setModal({
                  type: 'createTemplate',
                  project: project as Omit<ProjectResponse, 'file' | 'images' | 'content'>,
                }),
              )
            }
          >
            <TemplateIcon />
            <span>Make template</span>
          </div>
        </MenuItem>
      )}
      {auth && auth.id === project.author?.id && (
        <MenuItem className="Delete">
          <div
            className="m-row"
            onClick={() =>
              dispatch(
                setModal({
                  type: 'deleteProject',
                  project: project as Omit<ProjectResponse, 'file' | 'images' | 'content'>,
                }),
              )
            }
          >
            <DeleteIcon />
            <span>Delete</span>
          </div>
        </MenuItem>
      )}
    </>
  );
};

export const TemplateMenu = ({ template }: { template: Template }) => {
  const auth = useAuth();
  const dispatch = useAppDispatch();

  return (
    <>
      <MenuItem aria-label="Use">
        <div
          className="m-row"
          onClick={() => dispatch(setModal({ type: 'createProject', template: template }))}
        >
          <TemplateIcon />
          <span>Use template</span>
        </div>
      </MenuItem>
      {auth && auth.id === template.author?.id && (
        <MenuItem aria-label="Settings">
          <div
            className="m-row"
            onClick={() => dispatch(setModal({ type: 'templateSettings', template: template }))}
          >
            <EditIcon />
            <span>Edit settings</span>
          </div>
        </MenuItem>
      )}
      {auth && auth.id === template.author?.id && (
        <MenuItem className="Delete">
          <div
            className="m-row"
            onClick={() => dispatch(setModal({ type: 'deleteTemplate', template: template }))}
          >
            <DeleteIcon />
            <span>Delete</span>
          </div>
        </MenuItem>
      )}
    </>
  );
};
