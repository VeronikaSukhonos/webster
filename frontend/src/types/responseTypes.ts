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
