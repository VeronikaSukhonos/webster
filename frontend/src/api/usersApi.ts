import { createQuery } from '@utils/createQuery';

import type { UpdatePasswordParams, UpdateProfileParams } from '@mytypes/formParams';

import api from './api';

class UsersApi {
  async getUserProfile(id: number) {
    return await api.get(`/users/${id}`);
  }

  async getUserProjects(id: number, query?: { page?: number; limit?: number }) {
    return await api.get(`/users/${id}/projects${createQuery(query)}`);
  }

  async getUserTemplates(id: number, query?: { page?: number; limit?: number }) {
    return await api.get(`/users/${id}/templates${createQuery(query)}`);
  }

  async updateUserProfile(params: UpdateProfileParams) {
    return await api.patch(`/users/profile`, params);
  }

  async updateUserPassword(params: UpdatePasswordParams) {
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

  async requestUserProfileDeletion(id: number) {
    return await api.post(`/users/${id}`);
  }

  async deleteUserProfile(token: string) {
    return await api.delete(`/users/${token}`);
  }
}

export default new UsersApi();
