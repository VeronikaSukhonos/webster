import { TEMPLATE_TYPES } from '../utils/constants';

export type TemplateType = (typeof TEMPLATE_TYPES)[number]['value'];
export type JsonContent = Record<string, unknown>;

export interface UserResponse {
  id: number;
  username: string;
  avatar: string;
  about: string;
  registerDate: string;
}

export interface AuthUser extends UserResponse {
  email: string;
  hasPassword: boolean;
  googleId: string | null;
}

export interface ProjectResponse {
  id: number;
  author: Pick<UserResponse, 'id' | 'username'>;
  title: string;
  preview: string;
  width: number;
  height: number;
  file: string;
  content?: JsonContent;
  isPublic: boolean;
  createDate: string;
  editDate: string;
  template: Pick<TemplateResponse, 'id' | 'title'> | null;
}

export interface TemplateResponse {
  id: number;
  author: Pick<UserResponse, 'id' | 'username'>;
  title: string;
  preview: string;
  width: number;
  height: number;
  file: string;
  content?: JsonContent;
  type: TemplateType;
  createDate: string;
}
