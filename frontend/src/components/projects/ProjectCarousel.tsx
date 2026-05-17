import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

import { Load } from '@components/Load';
import { MainButton } from '@components/MainButton';

import { ChevronIcon } from '@assets/index';

import type { ProjectResponse, TemplateResponse } from '@mytypes/responseTypes';
import type { Feedback } from '@mytypes/utilTypes';

import { ProjectPreview } from './ProjectPreview';

import '../Pagination.css';
import './ProjectCarousel.css';

interface ProjectCarouselProps {
  projects?: ProjectResponse[];
  templates?: TemplateResponse[]
  areProjectsLoading: boolean;
  projectsFeedback: Feedback;
  noDataFeedback?: string;
}

const responsive = {
  big: {
    breakpoint: { max: 3000, min: 1300 },
    items: 5,
  },
  medium: {
    breakpoint: { max: 1300, min: 800 },
    items: 2,
  },
  small: {
    breakpoint: { max: 800, min: 0 },
    items: 1,
  },
};

const ButtonGroup = (props: any) => {
  const {
    previous,
    next,
    carouselState: { currentSlide, deviceType },
    total,
  } = props;

  return (
    <div className="carousel-button-group pagination">
      <MainButton
        onClick={() => previous()}
        disabled={currentSlide <= 0}
        color="white"
        mini={true}>
        <ChevronIcon className="prev" />
      </MainButton>
      <MainButton
        onClick={() => next()}
        disabled={currentSlide >= total - responsive[deviceType as keyof typeof responsive].items}
        color="white"
        mini={true}>
        <ChevronIcon className="next" />
      </MainButton>
    </div>
  );
};

const ProjectCarousel = ({
  projects,
  templates,
  areProjectsLoading,
  projectsFeedback,
  noDataFeedback,
}: ProjectCarouselProps) => {
  if (areProjectsLoading || !projectsFeedback.status) return <Load spinner={true} />;

  if (projectsFeedback.status === 'fail')
    return <p className="feedback center">{projectsFeedback.message}</p>;
  if (projectsFeedback.status === 'ok' && ((projects && !projects.length) || (templates && !templates.length)))
    return <p className="feedback center">{noDataFeedback}</p>;

  return (
    <Carousel
      responsive={responsive}
      containerClass="carousel-container"
      itemClass="carousel-item"
      arrows={false}
      customButtonGroup={<ButtonGroup total={projects ? projects.length : templates?.length} />}
      renderButtonGroupOutside={true}
    >
      {projects ? projects.map(project => {
        return <ProjectPreview key={project.id} project={project} template={undefined} />;
      }) : templates?.map(template => {
        return <ProjectPreview key={template.id} project={undefined} template={template} />;
      })}
    </Carousel>
  );
};

export default ProjectCarousel;
