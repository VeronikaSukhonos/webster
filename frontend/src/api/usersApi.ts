import type { UpdatePasswordParams, UpdateProfileParams } from '@mytypes/formParams';

import api from './api';

class UsersApi {
  async getUserProfile(id: number) {
    return await api.get(`/users/${id}`);
  }

  async updateUserProfile(params: UpdateProfileParams) {
    return await api.patch(`/users/profile`, params);
  }

  async updateUserPassword(params: Omit<UpdatePasswordParams, 'passwordConfirmation'>) {
    return await api.patch(`/users/password`, params);
  }

  async updateUserAvatar(fd: FormData) {
    return await api.patch(`/users/avatar`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async deleteUserAvatar() {
    return await api.delete(`/users/avatar`);
  }

  async requestUserProfileDeletion() {
    return await api.post(`/users`);
  }

  async deleteUserProfile(token: string) {
    return await api.delete(`/users/${token}`);
  }
}

export default new UsersApi();
