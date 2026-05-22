import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import clsx from 'clsx';

import ProjectsApi from '@api/projectsApi';
import usersApi from '@api/usersApi';

import { updateAuthUser } from '@store/authSlice';
import {
  selectUi,
  setModal,
  setProjectToDelete,
  setProjectToDuplicate,
  setProjectToUpdate,
} from '@store/uiSlice';

import ErrorPage from '@pages/ErrorPage';

import { Load } from '@components/Load';
import { Pagination } from '@components/Pagination';
import { ProjectList } from '@components/projects/ProjectList';

import {
  useAppDispatch,
  useAppSelector,
  useAuth,
  useFeedback,
  usePage,
  useTotal,
} from '@hooks/utilHooks';

import { DEFAULT_PROJECT_LIST_LIMIT } from '@utils/constants';

import type { AuthUser, ProjectResponse, UserResponse } from '@mytypes/responseTypes';

import './UserPage.css';

const UserProfilePage = () => {
  const dispatch = useAppDispatch();

  const { searchParams, getPage } = usePage();
  const { total, setTotal } = useTotal();

  const auth = useAuth();
  const isAvatarLoading = useAppSelector(selectUi.isAvatarLoading);

  const userId = parseInt(useParams().userId as string);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userFeedback, setUserFeedback] = useFeedback();
  const [user, setUser] = useState<UserResponse | AuthUser | null>(null);

  const [areProjectsLoading, setAreProjectsLoading] = useState(false);
  const [projectsFeedback, setProjectsFeedback] = useFeedback();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const projectToUpdate = useAppSelector(selectUi.projectToUpdate);
  const projectToDuplicate = useAppSelector(selectUi.projectToDuplicate);
  const projectToDelete = useAppSelector(selectUi.projectToDelete);

  useEffect(() => {
    if (!userId) return;
    let last = true;

    setIsUserLoading(true);
    usersApi
      .getUserProfile(userId)
      .then(({ data: res }) => {
        if (!last) return;
        setIsUserLoading(false);
        setUserFeedback(res.message, 'ok');
        setUser(res.data.user);
        if (userId === auth?.id) dispatch(updateAuthUser(res.data.user));
      })
      .catch((err) => {
        if (!last) return;
        setIsUserLoading(false);
        setUserFeedback(err.message, 'fail');
      });

    return () => {
      last = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || isUserLoading || userFeedback.status === 'fail') return;

    const pagination = { page: getPage(), limit: DEFAULT_PROJECT_LIST_LIMIT };

    setAreProjectsLoading(true);
    (userId === auth?.id
      ? ProjectsApi.getOwnProjects(pagination)
      : ProjectsApi.getPublicProjects({ ...pagination, authorId: userId })
    )
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
  }, [isUserLoading, searchParams]);

  useEffect(() => {
    if (userId === auth?.id && user) setUser({ ...user, avatar: auth.avatar });
  }, [auth?.avatar]);

  useEffect(() => {
    if (projectToUpdate || projectToDuplicate || projectToDelete) {
      const pagination = { page: getPage(), limit: DEFAULT_PROJECT_LIST_LIMIT };
      setAreProjectsLoading(true);
      ProjectsApi.getOwnProjects(pagination)
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

  if (!userId) return <ErrorPage entity="user" />;
  if (isUserLoading) return <Load spinner />;
  if (userFeedback.status === 'fail')
    return <ErrorPage reason={userFeedback.message} entity="user" />;

  return (
    <div className="col hor-center" style={{ paddingTop: '30px' }}>
      <div className="col profile-avatar-container">
        <img
          className={clsx(
            'profile-avatar',
            userId === auth?.id && 'self',
            isAvatarLoading && 'img-load',
          )}
          onClick={() => {
            if (userId === auth?.id && !isAvatarLoading)
              dispatch(setModal({ type: 'updateAvatar' }));
          }}
          src={user?.avatar}
          alt={`${user?.username}'s avatar`}
        />
      </div>
      <div className="col mini-gap t-center">
        <h1 className="profile-login">{user?.username}</h1>
        {userId === auth?.id && <p className="profile-email">{auth?.email}</p>}
        {user?.about && <p className="t-ital">{user.about}</p>}
      </div>
      <h2 className="content-title t-art t-center">
        {auth && auth.id === userId ? '' : 'Public'} Projects
      </h2>
      <ProjectList
        projects={projects}
        areProjectsLoading={areProjectsLoading}
        projectsFeedback={projectsFeedback}
      />
      <Pagination totalPages={total.totalPages} disabled={areProjectsLoading} />
    </div>
  );
};

export default UserProfilePage;
