import z from 'zod';

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
