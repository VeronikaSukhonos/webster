interface UserResponse {
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
  author: Pick<UserResponse, 'id' | 'username' | 'avatar'>;
  title: string;
  preview: string;
  file: string | object;
  isPublic: boolean;
  createDate: string;
  editDate: string;
  template: Pick<TemplateResponse, 'id' | 'title'> | null;
}

export interface TemplateResponse {
  id: number;
  author: Pick<UserResponse, 'id' | 'username' | 'avatar'>;
  title: string;
  preview: string;
  file: string | object;
  type: string;
  createDate: string;
}
