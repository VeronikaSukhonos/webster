export const TEMPLATE_TYPE_VALUES = [
  'other',
  'collage',
  'instagram-post',
  'instagram-story',
  'invitation',
  'presentation',
  'resume',
] as const;

export const TEMPLATE_TYPE_ENUM = [...TEMPLATE_TYPE_VALUES];
export const TEMPLATE_TYPE_EXAMPLE = 'instagram-post';

export type TemplateType = (typeof TEMPLATE_TYPE_VALUES)[number];
