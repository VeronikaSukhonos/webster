export const ERROR_TYPES = {
  SNR: 'Unable to connect to the server. Please try again later',
  OFL: 'You are offline. Please check your internet connection',
  SWW: 'Something went wrong',
};

export const DEFAULT_PROJECT_LIST_LIMIT = 20;

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
];

export const EXPORT_TYPES = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'pdf', label: 'PDF' },
  { value: 'webp', label: 'WebP' },
];
