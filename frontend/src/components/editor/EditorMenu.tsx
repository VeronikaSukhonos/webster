import { toast } from 'react-toastify';

import ProjectsApi from '@api/projectsApi';

import type { Project, Template } from '@store/editorSlice';
import { setModal, setProjectToDuplicate } from '@store/uiSlice';

import { MenuItem } from '@components/Menu';

import {
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  LinkIcon,
  TemplateIcon,
} from '@assets/index';

import { useAppDispatch, useAuth } from '@hooks/utilHooks';

import { copyLink } from '@utils/utils';

import type { ProjectResponse } from '@mytypes/responseTypes';

export const ProjectMenu = ({ project }: { project: Project }) => {
  const auth = useAuth();
  const dispatch = useAppDispatch();

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
      <MenuItem>
        <div
          className="m-row"
          onClick={() =>
            dispatch(
              setModal({
                type: 'exportProject',
                project: project as Omit<ProjectResponse, 'file' | 'images' | 'content'>,
              }),
            )
          }
        >
          <DownloadIcon />
          <span>Export</span>
        </div>
      </MenuItem>
      {auth && auth.id === project.author?.id && (
        <MenuItem>
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
        <MenuItem>
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
        <MenuItem>
          <div className="m-row" onClick={duplicateProject}>
            <CopyIcon />
            <span>Duplicate</span>
          </div>
        </MenuItem>
      )}
      {auth && auth.id === project.author?.id && (
        <MenuItem>
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
        <MenuItem>
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
      <MenuItem>
        <div
          className="m-row"
          onClick={() => dispatch(setModal({ type: 'createProject', template: template }))}
        >
          <TemplateIcon />
          <span>Use template</span>
        </div>
      </MenuItem>
      {auth && auth.id === template.author?.id && (
        <MenuItem>
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
        <MenuItem>
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
