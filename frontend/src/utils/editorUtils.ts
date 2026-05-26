import { jsPDF } from 'jspdf';
import Konva from 'konva';

import {
  DEFAULT_PROPS,
  ERROR_TYPES,
  EXPORT_TYPES,
  MAX_CANVAS_SIZE,
  MIN_CANVAS_SIZE,
} from '@utils/constants';

import type { Background, Canvas, CanvasProps, ImageItem, Size } from '@mytypes/editorTypes';
import type { ImageResponse } from '@mytypes/responseTypes';

export type ExportType = (typeof EXPORT_TYPES)[number]['value'];

export const createLocalImageItem = (
  file: File,
  storeFile: boolean = false,
  naturalSize?: Size,
): ImageItem => ({
  id: crypto.randomUUID(),
  url: URL.createObjectURL(file),
  urlSource: 'local',
  ...(naturalSize && { naturalWidth: naturalSize.width, naturalHeight: naturalSize.height }),
  ...(storeFile && { file }),
  deleted: false,
});

export const createServerImageItem = (file: ImageResponse): ImageItem => ({
  id: file.id,
  url: file.url,
  urlSource: 'server',
  deleted: false,
});

export const getImageSize = (url: string): Promise<Size> =>
  new Promise((resolve, reject) => {
    const image = document.createElement('img');

    image.onload = () =>
      resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    image.onerror = () => reject(new Error(ERROR_TYPES.SWW));
    image.src = url;
  });

export const fitSize = (size: Size, maxSize: Size): Size => {
  const scale = Math.min(maxSize.width / size.width, maxSize.height / size.height, 1);

  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
};

export const getImageItemSize = async (image?: ImageItem): Promise<Size | null> => {
  if (!image) return null;
  if (image.naturalWidth && image.naturalHeight) {
    return { width: image.naturalWidth, height: image.naturalHeight };
  }

  return getImageSize(image.url);
};

export const initCanvas = (size: Size, image?: ImageItem) => {
  const background: Background = {
    ...DEFAULT_PROPS.background,
    width: size.width,
    height: size.height,
    ...(image && { image: image.id }),
  };

  return {
    background,
    elements: [],
    images: { ...(image && { [image.id]: ['background'] }) },
  } as Canvas;
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

interface ExportFileProps extends CanvasProps {
  filename: string;
  format: ExportType;
  width?: number;
  height?: number;
  preview?: boolean;
}

export const exportFile = async ({
  stageRef,
  backgroundRef,
  filename,
  format = 'png',
  width,
  height,
  preview = true,
}: ExportFileProps) => {
  const stage = stageRef.current;
  const back = backgroundRef.current;
  let scale = 1;

  if (!stage || !back || !filename) return;
  if (width) scale = width / back.width();
  else if (height) scale = height / back.height();

  const excluded = stage.find('.excluded');

  excluded.forEach((n) => n.hide());

  const { x, y } = back.getAbsolutePosition();
  const mimeType =
    format === 'jpg' ? 'image/jpeg' : format === 'pdf' ? 'application/pdf' : `image/${format}`;
  const canvas = stage.toCanvas({
    x,
    y,
    width: back.width() * stage.scaleX(),
    height: back.height() * stage.scaleX(),
    pixelRatio: (scale * (format === 'pdf' ? 2 : 1)) / (preview ? 1 : stage.scaleX()),
  });
  if (format === 'pdf') {
    const pdf = new jsPDF('l', 'px', [canvas.width, canvas.height]);
    pdf.addImage(canvas, 0, 0, canvas.width, canvas.height);
    const blob = pdf.output('blob');

    excluded.forEach((n) => n.show());

    return new File([blob], filename, {
      type: mimeType,
    });
  } else {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(ERROR_TYPES.SWW))), mimeType);
    });

    excluded.forEach((n) => n.show());

    return new File([blob], filename, {
      type: mimeType,
    });
  }
};

interface ExportFileFromJsonProps {
  filename: string;
  format: ExportType;
  content?: Canvas;
  images?: ImageResponse[];
  selectedIds?: string[];
}

export const exportFileFromJson = async ({
  filename,
  format = 'png',
  content,
  images,
  selectedIds = [],
}: ExportFileFromJsonProps) => {
  if (!content) {
    return;
  }

  const container = document.createElement('div');
  const stage = new Konva.Stage({
    container,
    width: content.background.width,
    height: content.background.height,
  });

  const bgLayer = new Konva.Layer();
  stage.add(bgLayer);
  const bgGroup = new Konva.Group();
  bgLayer.add(bgGroup);
  // if (format === 'jpg') {
  //   const fillerBgLayer = new Konva.Rect({
  //     width: content.background.width,
  //     height: content.background.height,
  //     fill: "white",
  //     stroke: "white",
  //   });
  //   bgGroup.add(fillerBgLayer);
  // }
  const bg = new Konva.Rect(content.background);
  bgGroup.add(bg);
  if (content.background.image && images) {
    await new Promise((resolve, reject) => {
      Konva.Image.fromURL(
        images[images.findIndex((image) => image.id === content.background.image)].url,
        (bgImage) => {
          const image = bgImage.image();
          bgImage.setAttrs({
            width: content.background.width,
            height: content.background.height,
            image,
          });
          bgGroup.add(bgImage);
          resolve(bgImage);
        },
        () => {
          reject(new Error(ERROR_TYPES.SWW));
        },
      );
    });
  }

  const elementsLayer = new Konva.Layer();
  stage.add(elementsLayer);
  content.elements
    .filter((el) => !selectedIds.includes(el.id))
    .forEach((el) => {
      const element = new Konva.Rect(el);
      elementsLayer.add(element);
    });

  const actionLayer = new Konva.Layer();
  stage.add(actionLayer);
  content.elements
    .filter((el) => selectedIds.includes(el.id))
    .forEach((el) => {
      const element = new Konva.Rect(el);
      actionLayer.add(element);
    });

  const mimeType =
    format === 'jpg' ? 'image/jpeg' : format === 'pdf' ? 'application/pdf' : `image/${format}`;
  if (format === 'pdf') {
    const pdf = new jsPDF('l', 'px', [content.background.width, content.background.height]);
    pdf.addImage(
      stage.toDataURL({ pixelRatio: 2 }),
      0,
      0,
      content.background.width,
      content.background.height,
    );
    const blob = pdf.output('blob');

    stage.destroy();

    return new File([blob], filename, {
      type: mimeType,
    });
  } else {
    const canvas = stage.toCanvas();
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(ERROR_TYPES.SWW))), mimeType);
    });

    stage.destroy();

    return new File([blob], filename, {
      type: mimeType,
    });
  }
};
