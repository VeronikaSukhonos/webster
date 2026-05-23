import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import projectsApi from '@api/projectsApi';

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
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const auth = useAuth();

  const [areProjectsLoading, setAreProjectsLoading] = useState(false);
  const [projectsFeedback, setProjectsFeedback] = useFeedback();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);

  const { searchParams, setSearchParams, getPage } = usePage();
  const [search, setSearch] = useState(searchParams.get('search') ?? undefined);
  const { total, setTotal } = useTotal();

  const projectToUpdate = useAppSelector(selectUi.projectToUpdate);
  const projectToDuplicate = useAppSelector(selectUi.projectToDuplicate);
  const projectToDelete = useAppSelector(selectUi.projectToDelete);
  const [shouldRefetch, setShouldRefetch] = useState(true);

  const searchProjects = function (e: React.SubmitEvent) {
    e.preventDefault();
    setSearchParams(search && { search });
    setShouldRefetch(true);
  };

  useEffect(() => {
    if (projectToUpdate || projectToDuplicate || projectToDelete) {
      setSearch('');
      setSearchParams({});
      setShouldRefetch(true);
    }
  }, [projectToUpdate, projectToDuplicate, projectToDelete]);

  useEffect(() => {
    if (!shouldRefetch) setShouldRefetch(true);
  }, [searchParams]);

  useEffect(() => {
    if (!auth) navigate('/');
    else {
      if (!shouldRefetch) return;
      setAreProjectsLoading(true);
      projectsApi
        .getOwnProjects({ page: getPage(), limit: DEFAULT_PROJECT_LIST_LIMIT, search })
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
        })
        .finally(() => {
          dispatch(setProjectToUpdate(null));
          dispatch(setProjectToDuplicate(null));
          dispatch(setProjectToDelete(null));
          setShouldRefetch(false);
        });
    }
  }, [auth, searchParams, shouldRefetch]);

  useEffect(() => {
    return () => {
      dispatch(setProjectToUpdate(null));
      dispatch(setProjectToDuplicate(null));
      dispatch(setProjectToDelete(null));
    };
  }, []);

  if (!auth) navigate('/');
  else {
    return (
      <div className="col hor-center grow">
        <h1 className="slogan t-art t-center">Projects</h1>
        <form onSubmit={searchProjects} style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
          <TextField
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value === '' ? undefined : e.target.value)}
            placeholder="Search project..."
            disabled={areProjectsLoading}
          />
          <MainButton type="submit" color="white" disabled={areProjectsLoading}>
            <SearchIcon />
          </MainButton>
        </form>
        <ProjectList
          projects={projects}
          areProjectsLoading={areProjectsLoading}
          projectsFeedback={projectsFeedback}
          noDataFeedback="No projects yet"
        />
        <Pagination totalPages={total.totalPages} disabled={areProjectsLoading} />
      </div>
    );
  }
};

export default ProjectsPage;
