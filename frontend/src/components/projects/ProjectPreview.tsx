import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { setModal } from '@store/uiSlice';

import ProjectsApi from '@api/projectsApi';
import TemplatesApi from '@api/templatesApi';

import { MainButton } from '@components/MainButton';
import { DropdownMenu, MenuItem } from '@components/Menu';

import { DotsIcon, PublicIcon, DownloadIcon, EditIcon, LinkIcon, CopyIcon, TemplateIcon, DeleteIcon, EyeOpenIcon } from '@assets/index';

import { useAppDispatch, useAuth } from '@hooks/utilHooks';

import type { ProjectResponse, TemplateResponse } from '@mytypes/responseTypes';

import './ProjectPreview.css';

interface ProjectPreviewProps {
  project?: ProjectResponse;
  template?: TemplateResponse;
}

export const ProjectPreview = ({ project, template }: ProjectPreviewProps) => {
  const auth = useAuth();
  const dispatch = useAppDispatch();
  const copyLink = async () => {
    await navigator.clipboard
      .writeText(`${window.location.origin}/editor?projectId=${project?.id}`)
      .then(() => {
        toast('Project link was copied to the clipboard');
      })
      .catch(() => {
        toast('Something went wrong');
      });
  }
  const duplicateProject = async function() {
    if (project) {
      ProjectsApi.duplicateProject(project.id)
        .then(({ data: res }) => {
          toast(res.message);
        })
        .catch((err) => {
          toast(err.message);
        });
    }
  }
  const deleteProject = async function() {
    if (project) {
      ProjectsApi.deleteProject(project.id)
        .then(({ data: res }) => {
          toast(res.message);
        })
        .catch((err) => {
          toast(err.message);
        });
    }
  }
  const deleteTemplate = async function() {
    if (template) {
      TemplatesApi.deleteTemplate(template.id)
        .then(({ data: res }) => {
          toast(res.message);
        })
        .catch((err) => {
          toast(err.message);
        });
    }
  }
  return (
    <Link to={project ? `/editor?projectId=${project.id}` : `/editor?templateId=${template?.id}`}>
      <div className="project-preview">
        <div className="image-and-size">
          <img src={project ? (project.preview === "" ? "http://localhost:3000/files/projects/default-preview.jpg" : project.preview) : (template?.preview === "" ? "http://localhost:3000/files/projects/default-preview.jpg" : template?.preview)} alt={project ? `Project ${project.title}'s preview` : `Template ${template?.title}'s preview`} />
          <DropdownMenu
            button={
              <MainButton className="project-preview-menu" color="white" mini={true}>
                <DotsIcon />
              </MainButton>
            }
          >
            {project && <MenuItem>
              <div className="m-row" onClick={() => dispatch(setModal({ type: 'exportProject' }))}>
                <DownloadIcon />
                <span>Export</span>
              </div>
            </MenuItem>}
            {template && <MenuItem>
              <div className="m-row">
                <EyeOpenIcon />
                <span>View</span>
              </div>
            </MenuItem>}
            { auth && (auth.id === project?.author.id || auth.id === template?.authorId) && <MenuItem>
              <div className="m-row" onClick={() => dispatch(setModal({ type: project ? 'projectSettings' : 'templateSettings' }))}>
                <EditIcon />
                <span>Edit settings</span>
              </div>
            </MenuItem>}
            {project && project.isPublic && <MenuItem>
              <div className="m-row" onClick={copyLink}>
                <LinkIcon />
                <span>Copy link</span>
              </div>
            </MenuItem>}
            { auth && project && auth.id === project.author.id && <MenuItem>
              <div className="m-row" onClick={duplicateProject}>
                <CopyIcon />
                <span>Duplicate</span>
              </div>
            </MenuItem>}
            {auth && project && auth.id === project.author.id && <MenuItem>
              <div className="m-row" onClick={() => dispatch(setModal({ type: 'createTemplate' }))}>
                <TemplateIcon />
                <span>Make template</span>
              </div>
            </MenuItem>}
            {auth && ((project && auth.id === project.author.id) || (template && auth.id === template.authorId)) && <MenuItem>
              <div className="m-row" onClick={project ? deleteProject : deleteTemplate}>
                <DeleteIcon />
                <span>Delete</span>
              </div>
            </MenuItem>}
          </DropdownMenu>
          <p className="size">{project ? project.width : template?.width} x {project ? project.height : template?.height}</p>
        </div>
        <div className="project-info">
          <div className="project-name">
            <p className="title">{project ? project.title : template?.title}</p>
            {project && project.isPublic && <PublicIcon />}
          </div>
          {project && <p>edited {new Date().getTime() - new Date(project.editDate).getTime() < 864000000 ? "today" : (new Date().getTime() - new Date(project.editDate).getTime() < 172800000 ? "yesterday" : `${(new Date().getTime() - new Date(project.editDate).getTime()) / 86400000} days ago`)}</p>}
          {template && <p>{template.isBuiltIn ? "built-in" : "custom"} ・ {template.type}</p>}
        </div>
      </div>
    </Link>
  );
};
