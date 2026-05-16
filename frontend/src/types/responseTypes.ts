import { TEMPLATE_TYPES } from '@utils/constants';

import type { Canvas } from '@mytypes/editorTypes';

export type TemplateType = (typeof TEMPLATE_TYPES)[number]['value'];

export interface UserResponse {
  id: number;
  username: string;
  avatar: string;
  about: string;
  registerDate: string;
}

export interface AuthUser extends UserResponse {
  email: string;
  isAdmin: boolean;
  hasPassword: boolean;
  googleId: string | null;
}

export interface ImageResponse {
  id: string;
  url: string;
}

interface BaseContentResponse {
  id: number;
  author: Pick<UserResponse, 'id' | 'username'>;
  title: string;
  preview: string;
  width: number;
  height: number;
  file: string;
  content?: Canvas;
  images?: ImageResponse[];
  createDate: string;
}

export interface ProjectResponse extends BaseContentResponse {
  editDate: string;
  isPublic: boolean;
  template: Pick<TemplateResponse, 'id' | 'title'> | null;
}

export interface TemplateResponse extends BaseContentResponse {
  type: TemplateType;
}
