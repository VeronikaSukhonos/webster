import type Konva from 'konva';

import { ERROR_TYPES, EXPORT_TYPES, MAX_CANVAS_SIZE, MIN_CANVAS_SIZE } from '@utils/constants';

import type { Background, Canvas, ImageItem, Size } from '@mytypes/editorTypes';
import type { ImageResponse } from '@mytypes/responseTypes';

export type ExportType = (typeof EXPORT_TYPES)[number]['value'];

export const createLocalImageItem = (file: File, storeFile: boolean = false): ImageItem => ({
  id: crypto.randomUUID(),
  url: URL.createObjectURL(file),
  urlSource: 'local',
  ...(storeFile && { file }),
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

interface ExportFileProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  filename: string;
  format: ExportType;
  width?: number;
  height?: number;
}

export const exportFile = async ({
  stageRef,
  filename,
  format = 'png',
  width,
  height,
}: ExportFileProps) => {
  const stage = stageRef.current;
  let scale = 1;

  if (!stage || !filename) return;
  if (width) scale = width / stage.width();
  else if (height) scale = height / stage.height();

  const canvas = stage.toCanvas({ pixelRatio: scale });
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(ERROR_TYPES.SWW))), `image/${format}`);
  });

  return new File([blob], filename, {
    type: `image/${format}`,
  });
};
