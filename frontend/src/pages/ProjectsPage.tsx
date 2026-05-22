import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ProjectsApi from '@api/projectsApi';

import {
  selectUi,
  setProjectToDelete,
  setProjectToDuplicate,
  setProjectToUpdate,
} from '@store/uiSlice';

import { TextField } from '@components/InputFields';
import { MainButton } from '@components/MainButton';
import { Pagination } from '@components/Pagination';
import { ProjectList } from '@components/projects/ProjectList';

import { SearchIcon } from '@assets/index';

import {
  useAppDispatch,
  useAppSelector,
  useAuth,
  useFeedback,
  usePage,
  useTotal,
} from '@hooks/utilHooks';

import { DEFAULT_PROJECT_LIST_LIMIT } from '@utils/constants';

import type { ProjectResponse } from '@mytypes/responseTypes';

const ProjectsPage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [areProjectsLoading, setAreProjectsLoading] = useState(false);
  const [projectsFeedback, setProjectsFeedback] = useFeedback();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [search, setSearch] = useState(undefined);
  const { searchParams, setSearchParams, getPage } = usePage();
  const { total, setTotal } = useTotal();
  const projectToUpdate = useAppSelector(selectUi.projectToUpdate);
  const projectToDuplicate = useAppSelector(selectUi.projectToDuplicate);
  const projectToDelete = useAppSelector(selectUi.projectToDelete);
  const searchProjects = function (e: React.SubmitEvent) {
    e.preventDefault();
    const pagination = { page: getPage(), limit: DEFAULT_PROJECT_LIST_LIMIT };
    setSearchParams({ search: search === undefined ? '' : search });
    setAreProjectsLoading(true);
    ProjectsApi.getOwnProjects({
      ...pagination,
      search: search,
    })
      .then(({ data: res }) => {
        setAreProjectsLoading(false);
        setProjectsFeedback(res.message, 'ok');
        setProjects(res.data.projects);
        setTotal(res.data.pagination.total, res.data.pagination.limit);
      })
      .catch((err) => {
        setAreProjectsLoading(false);
        setProjectsFeedback(err.message, 'fail');
        setProjects([]);
        setTotal();
      });
  };
  useEffect(() => {
    if (!auth) navigate('/');
    else {
      const pagination = { page: getPage(), limit: DEFAULT_PROJECT_LIST_LIMIT };
      setAreProjectsLoading(true);
      ProjectsApi.getOwnProjects({ ...pagination, search: search })
        .then(({ data: res }) => {
          setAreProjectsLoading(false);
          setProjectsFeedback(res.message, 'ok');
          setProjects(res.data.projects);
          setTotal(res.data.pagination.total, res.data.pagination.limit);
        })
        .catch((err) => {
          setAreProjectsLoading(false);
          setProjectsFeedback(err.message, 'fail');
          setProjects([]);
          setTotal();
        });
    }
  }, [auth, searchParams]);
  useEffect(() => {
    if (projectToUpdate || projectToDuplicate || projectToDelete) {
      const pagination = { page: getPage(), limit: DEFAULT_PROJECT_LIST_LIMIT };
      setAreProjectsLoading(true);
      ProjectsApi.getOwnProjects({
        ...pagination,
        search: search,
      })
        .then(({ data: res }) => {
          setAreProjectsLoading(false);
          setProjectsFeedback(res.message, 'ok');
          setProjects(res.data.projects);
          setTotal(res.data.pagination.total, res.data.pagination.limit);
        })
        .catch((err) => {
          setAreProjectsLoading(false);
          setProjectsFeedback(err.message, 'fail');
          setProjects([]);
          setTotal();
        });
    }
  }, [projectToUpdate, projectToDuplicate, projectToDelete, searchParams]);
  useEffect(() => {
    return () => {
      dispatch(setProjectToUpdate(null));
    };
  }, []);
  useEffect(() => {
    return () => {
      dispatch(setProjectToDuplicate(null));
    };
  }, []);
  useEffect(() => {
    return () => {
      dispatch(setProjectToDelete(null));
    };
  }, []);
  if (!auth) navigate('/');
  else {
    return (
      <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
        <h1 className="slogan t-art t-center">Projects</h1>
        <form
          onSubmit={searchProjects}
          style={{ display: 'flex', flexDirection: 'row', gap: 5 + 'px', marginBottom: 10 + 'px' }}
        >
          <TextField
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value === '' ? undefined : e.target.value)}
            placeholder="Search project..."
          />
          <MainButton type="submit" color="white">
            <SearchIcon />
          </MainButton>
        </form>
        <ProjectList
          projects={projects}
          areProjectsLoading={areProjectsLoading}
          projectsFeedback={projectsFeedback}
          noDataFeedback="You do not have any projects yet"
        />
        <Pagination totalPages={total.totalPages} disabled={areProjectsLoading} />
      </div>
    );
  }
};

export default ProjectsPage;
