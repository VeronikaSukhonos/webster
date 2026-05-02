import { createQuery } from '@utils/createQuery';

// import type { CreateProjectParams, UpdateProjectParams } from '@mytypes/formParams';

import api from './api';

class ProjectsApi {
  async getPublicProjects(query?: { page?: number; limit?: number; user?: number }) {
    return await api.get(`/projects/public/${createQuery(query)}`);
  }

  async getOwnProjects(query?: { page?: number; limit?: number; title?: string }) {
    return await api.get(`/projects/${createQuery(query)}`);
  }

  async getProject(id: number) {
    return await api.get(`/projects/${id}`);
  }

  // async createProject(params: CreateProjectParams) {
  //   return await api.post(`/projects`, params);
  // }

  async duplicateProject(id: number) {
    return await api.post(`/projects/${id}/duplicate`);
  }

  // async updateProject(id: number, params: UpdateProjectParams) {
  //   return await api.patch(`/projects/${id}`, params);
  // }

  async deleteProject(id: number) {
    return await api.delete(`/projects/${id}`);
  }
}

export default new ProjectsApi();
