export const TEMPLATE_TYPE_VALUES = [
  'other',
  'collage',
  'facebook-post',
  'facebook-story',
  'invitation',
  'pinterest-pin',
  'resume',
] as const;

export const TEMPLATE_TYPE_ENUM = [...TEMPLATE_TYPE_VALUES];
export const TEMPLATE_TYPE_EXAMPLE = 'facebook-post';
export const TEMPLATE_TYPE_VALIDATION_MESSAGE =
  'type must be one of the following values: other, collage, facebook-post, facebook-story, invitation, pinterest-pin, resume';

export type TemplateType = (typeof TEMPLATE_TYPE_VALUES)[number];
