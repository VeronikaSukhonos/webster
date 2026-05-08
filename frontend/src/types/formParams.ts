import z from 'zod';

import { EXPORT_TYPES, TEMPLATE_TYPES, VISIBILITY_TYPES } from '@utils/constants';

const requiredField = (fieldname: string) => {
  return z.string().trim().nonempty(`${fieldname} is required`);
};

const username = z
  .string()
  .trim()
  .max(25, 'username must have 3-25 characters')
  .min(3, 'username must have 3-25 characters')
  .regex(/^[a-zA-Z]/, 'username must start with a letter')
  .regex(/^[a-zA-Z0-9]+$/, 'username must contain only letters and digits')
  .nonempty('username is required');

const email = z
  .email('email must be valid')
  .trim()
  .max(100, 'email must be at most 100 characters')
  .nonempty('email is required');

const title = z
  .string()
  .trim()
  .max(100, 'title must be at most 100 characters')
  .nonempty('title is required');

const sizeField = (fieldname: string) => {
  return z.number().positive(`${fieldname} must be a positive integer`).optional();
};

export const passwordParams = z
  .object({
    password: z
      .string()
      .regex(/[0-9]/, 'password must contain at least 1 digit')
      .regex(/[A-Z]/, 'password must contain at least 1 uppercase letter')
      .regex(/[a-z]/, 'password must contain at least 1 lowercase letter')
      .min(8, 'password must be longer than 8 characters')
      .nonempty('password is required'),
    passwordConfirmation: z.string().nonempty('password confirmation is required'),
  })
  .refine(
    (params) => {
      return params.password === params.passwordConfirmation;
    },
    { message: 'passwords do not match', path: ['passwordConfirmation'] },
  );
export type PasswordParams = z.infer<typeof passwordParams>;

export const registerParams = passwordParams.extend({ username, email });
export type RegisterParams = z.infer<typeof registerParams>;

export const loginParams = z.object({
  username: requiredField('username or email'),
  password: requiredField('password'),
});
export type LoginParams = z.infer<typeof loginParams>;

export const authRequestLinkParams = z.object({ email: requiredField('email') });
export type AuthRequestLinkParams = z.infer<typeof authRequestLinkParams>;

export const updateProfileParams = z.object({
  username,
  about: z.string().trim().max(150, 'about must be at most 150 characters').nullish(),
});
export type UpdateProfileParams = z.infer<typeof updateProfileParams>;

export const updatePasswordParams = passwordParams
  .extend({ currentPassword: z.string().optional() })
  .refine(
    (params) => {
      return params.currentPassword !== '';
    },
    { message: 'current password is required', path: ['currentPassword'] },
  );
export type UpdatePasswordParams = z.infer<typeof updatePasswordParams>;

export const createProjectParams = z
  .object({
    title,
    type: z.enum(['blank', 'upload', 'template']),
    size: z.object({ width: sizeField('width'), height: sizeField('height') }),
    image: z.string().trim().optional(),
  })
  .refine(
    (params) => {
      return params.type === 'blank' && params.size.width && params.size.height;
    },
    { message: 'width and height are required', path: ['size'] },
  )
  .refine(
    (params) => {
      return params.type === 'upload' && params.image;
    },
    { message: 'image is required', path: ['image'] },
  );
export type CreateProjectParams = z.infer<typeof createProjectParams>;

export const projectSettingsParams = z.object({
  title,
  description: z.string().trim().max(300, 'description must be at most 300 characters').nullish(),
  visibility: z.enum(
    VISIBILITY_TYPES.map((t) => t.value),
    'invalid visibility type',
  ),
});
export type ProjectSettingsParams = z.infer<typeof projectSettingsParams>;

export const templateParams = z.object({
  title,
  type: z.enum(
    TEMPLATE_TYPES.map((t) => t.value),
    'invalid template type',
  ),
});
export type TemplateParams = z.infer<typeof templateParams>;

export const deleteParams = z
  .object({
    title: z.string().trim(),
    expectedTitle: z.string().trim(),
  })
  .refine(
    (params) => {
      return params.title === params.expectedTitle;
    },
    { message: 'title is required', path: ['title'] },
  );
export type DeleteParams = z.infer<typeof deleteParams>;

export const exportProjectParams = z.object({
  title,
  format: z.enum(
    EXPORT_TYPES.map((t) => t.value),
    'invalid format',
  ),
});
export type exportProjectParams = z.infer<typeof exportProjectParams>;
