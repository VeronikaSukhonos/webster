import { MAX_CANVAS_SIZE, MIN_CANVAS_SIZE } from '@utils/constants';

import type { Background, Canvas, ImageItem, Size } from '@mytypes/editorTypes';
import type { ImageResponse } from '@mytypes/responseTypes';

export const createLocalImageItem = (file: File): ImageItem => ({
  id: crypto.randomUUID(),
  url: URL.createObjectURL(file),
  urlSource: 'local',
  file,
  deleted: false,
});

export const createServerImageItem = (file: ImageResponse): ImageItem => ({
  id: file.id,
  url: file.url,
  urlSource: 'server',
  deleted: false,
});

export const initCanvas = (size: Size, image?: ImageItem) => {
  const background: Background = {
    id: crypto.randomUUID(),
    type: 'background',
    width: size.width,
    height: size.height,
    ...(image ? { fillPatternImage: image.id } : { fill: 'transparent' }),
  };

  return { background, layers: [] } as Canvas;
};

export const getInitCanvasSize = (img: HTMLImageElement) => {
  let { width, height } = img;

  if (width > MAX_CANVAS_SIZE || height > MAX_CANVAS_SIZE) {
    const downscale = Math.min(MAX_CANVAS_SIZE / width, MAX_CANVAS_SIZE / height, 1);

    width = width * downscale;
    height = height * downscale;
  } else if (width < MIN_CANVAS_SIZE || height < MIN_CANVAS_SIZE) {
    const upscale = Math.max(MIN_CANVAS_SIZE / width, MIN_CANVAS_SIZE / height, 1);

    width = width * upscale;
    height = height * upscale;
  }

  return { width: Math.round(width), height: Math.round(height) };
};
