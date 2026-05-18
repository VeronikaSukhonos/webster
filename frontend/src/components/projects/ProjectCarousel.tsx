import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

import { Load } from '@components/Load';
import { MainButton } from '@components/MainButton';
import { ProjectPreview } from '@components/projects/ProjectPreview';

import { ChevronIcon } from '@assets/index';

import type { ProjectResponse, TemplateResponse } from '@mytypes/responseTypes';
import type { Feedback } from '@mytypes/utilTypes';

import './ProjectList.css';

interface ProjectCarouselProps {
  projects?: ProjectResponse[];
  templates?: TemplateResponse[];
  areProjectsLoading: boolean;
  projectsFeedback: Feedback;
  noDataFeedback?: string;
}

const responsive = {
  big: {
    breakpoint: { max: 3000, min: 1420 },
    items: 5,
  },
  mediumBig: {
    breakpoint: { max: 1420, min: 1150 },
    items: 4,
  },
  medium: {
    breakpoint: { max: 1150, min: 870 },
    items: 3,
  },
  mediumSmall: {
    breakpoint: { max: 870, min: 600 },
    items: 2,
  },
  small: {
    breakpoint: { max: 600, min: 0 },
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
    <div className="row all-center mini-gap" style={{ maxWidth: 'max-content' }}>
      <MainButton
        onClick={() => previous()}
        disabled={currentSlide <= 0}
        color="white"
        square
        mini
        className="pagination-nav-button"
      >
        <ChevronIcon style={{ padding: '2px' }} />
      </MainButton>
      <MainButton
        onClick={() => next()}
        disabled={currentSlide >= total - responsive[deviceType as keyof typeof responsive].items}
        color="white"
        square
        mini
        className="pagination-nav-button"
      >
        <ChevronIcon style={{ transform: 'rotate(180deg)', padding: '2px' }} />
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
  if (areProjectsLoading || !projectsFeedback.status) return <Load spinner />;

  if (projectsFeedback.status === 'fail')
    return <p className="feedback t-ital">{projectsFeedback.message}</p>;
  if (
    projectsFeedback.status === 'ok' &&
    ((projects && !projects.length) || (templates && !templates.length))
  )
    return <p className="feedback t-ital">{noDataFeedback}</p>;

  return (
    <Carousel
      responsive={responsive}
      containerClass="carousel-container"
      itemClass="carousel-item"
      arrows={false}
      customButtonGroup={<ButtonGroup total={projects ? projects.length : templates?.length} />}
      renderButtonGroupOutside={true}
    >
      {projects
        ? projects.map((project) => {
            return <ProjectPreview key={project.id} project={project} template={undefined} />;
          })
        : templates?.map((template) => {
            return <ProjectPreview key={template.id} project={undefined} template={template} />;
          })}
    </Carousel>
  );
};

export default ProjectCarousel;
