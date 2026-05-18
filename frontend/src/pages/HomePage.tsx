import { useEffect, useState } from 'react';

import projectsApi from '@api/projectsApi';
import templatesApi from '@api/templatesApi';

import { setModal } from '@store/uiSlice';

import { MainButton } from '@components/MainButton';
import ProjectCarousel from '@components/projects/ProjectCarousel';

import { PlusIcon, TemplateIcon } from '@assets/index';

import { useAppDispatch, useAuth, useFeedback } from '@hooks/utilHooks';

import type { ProjectResponse, TemplateResponse } from '@mytypes/responseTypes';

const HomePageAuth = () => {
  const [areProjectsLoading, setAreProjectsLoading] = useState(false);
  const [projectsFeedback, setProjectsFeedback] = useFeedback();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [areTemplatesLoading, setAreTemplatesLoading] = useState(false);
  const [templatesFeedback, setTemplatesFeedback] = useFeedback();
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);

  useEffect(() => {
    setAreProjectsLoading(true);
    projectsApi
      .getOwnProjects()
      .then(({ data: res }) => {
        setAreProjectsLoading(false);
        setProjectsFeedback(res.message, 'ok');
        setProjects(res.data.projects);
      })
      .catch((err) => {
        setAreProjectsLoading(false);
        setProjectsFeedback(err.message, 'fail');
        setProjects([]);
      });
  }, []);

  useEffect(() => {
    setAreTemplatesLoading(true);
    templatesApi
      .getRecentTemplates()
      .then(({ data: res }) => {
        setAreTemplatesLoading(false);
        setTemplatesFeedback(res.message, 'ok');
        setTemplates(res.data.templates);
      })
      .catch((err) => {
        setAreTemplatesLoading(false);
        setTemplatesFeedback(err.message, 'fail');
        setTemplates([]);
      });
  }, []);

  return (
    <>
      <h2 className="content-title t-art t-center">Recent Templates</h2>
      <ProjectCarousel
        templates={templates}
        areProjectsLoading={areTemplatesLoading}
        projectsFeedback={templatesFeedback}
        noDataFeedback={'You have not used any templates yet'}
      />
      <h2 className="content-title t-art t-center">Recent Projects</h2>
      <ProjectCarousel
        projects={projects}
        areProjectsLoading={areProjectsLoading}
        projectsFeedback={projectsFeedback}
        noDataFeedback={'You do not have any projects yet'}
      />
    </>
  );
};

const HomePageGuest = () => {
  const dispatch = useAppDispatch();

  return (
    <>
      <div className="box pd-box t-center">
        <p style={{ lineHeight: '150%' }}>
          <span className="app-name">
            Sket<span>Cherry</span>
          </span>{' '}
          is a simple online graphic editor that empowers anyone
          <span
            style={{
              color: 'var(--dark-blue)',
              display: 'block',
              fontWeight: 'bold',
              fontStyle: 'italic',
            }}
          >
            – regardless of design experience –
          </span>
          to effortlessly create stunning visuals
        </p>
      </div>
      <div className="row all-center" style={{ width: '340px', maxWidth: '100%' }}>
        <MainButton
          onClick={() => dispatch(setModal({ type: 'createProject' }))}
          upperText
          style={{ flex: 1 }}
        >
          <PlusIcon />
          Create
        </MainButton>
        <MainButton to="/templates" color="white" upperText style={{ flex: 1 }}>
          <TemplateIcon />
          Templates
        </MainButton>
      </div>
    </>
  );
};

const HomePage = () => {
  const auth = useAuth();

  return (
    <div className="col grow all-center">
      <h1 className="slogan t-art t-center">
        Everyone can make art!
        <br />
        Right now!
      </h1>
      {auth ? <HomePageAuth /> : <HomePageGuest />}
    </div>
  );
};

export default HomePage;
