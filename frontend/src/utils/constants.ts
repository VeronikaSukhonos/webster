export const ERROR_TYPES = {
  SNR: 'Unable to connect to the server. Please try again later',
  OFL: 'You are offline. Please check your internet connection',
  SWW: 'Something went wrong',
};

export const DEFAULT_PROJECT_LIST_LIMIT = 10;
export const AUTOSAVE_DELAY = 7000;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MIN_CANVAS_SIZE = 40;
export const MAX_CANVAS_SIZE = 4000;
export const DEFAULT_CANVAS_SIZE = 1080;
export const DEFAULT_SHAPE_COLOR = '#eaeaea';
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 5;
export const SCALE_FACTOR = 1.05;
export const SUPPORTED_UPLOADS = ['image/png', 'image/jpeg'];

export const SIZE_TYPES = [
  { width: null, height: null },
  { width: 1080, height: 1080, proportion: '1:1' },
  { width: 1080, height: 1920, proportion: '9:16' },
  { width: 1080, height: 1350, proportion: '4:5' },
  { width: 1920, height: 1080, proportion: '16:9' },
  { width: 1350, height: 1080, proportion: '5:4' },
];

export const TEMPLATE_TYPES = [
  { value: 'other', label: 'Other' },
  { value: 'collage', label: 'Collage' },
  { value: 'instagram-post', label: 'Instagram Post' },
  { value: 'instagram-story', label: 'Instagram Story' },
  { value: 'invitation', label: 'Invitation' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'resume', label: 'Resume' },
] as const;

export const VISIBILITY_TYPES = [
  { value: 'me', label: 'Only me' },
  { value: 'everyone', label: 'Everyone with link' },
] as const;

export const EXPORT_TYPES = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'pdf', label: 'PDF' },
  { value: 'webp', label: 'WebP' },
] as const;
