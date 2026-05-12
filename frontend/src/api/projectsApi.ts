import { createQuery } from '@utils/createQuery';

import type { JsonContent } from '@mytypes/responseTypes';

import api from './api';

interface CreateProjectRequest {
  title: string;
  description?: string | null;
  content: JsonContent;
  preview: string;
  width: number;
  height: number;
  isPublic?: boolean;
  templateId?: number | null;
}

interface UpdateProjectRequest {
  title?: string;
  description?: string | null;
  content?: JsonContent;
  preview?: string;
  width?: number;
  height?: number;
  isPublic?: boolean;
  templateId?: number | null;
  editDate?: string;
}

interface CreateProjectFromTemplateRequest {
  title: string;
  description?: string | null;
  isPublic?: boolean;
}

class ProjectsApi {
  async getPublicProjects(query?: {
    page?: number;
    limit?: number;
    search?: string;
    authorId?: number;
  }) {
    return await api.get(`/projects/public/${createQuery(query)}`);
  }

  async getOwnProjects(query?: { page?: number; limit?: number; search?: string }) {
    return await api.get(`/projects/${createQuery(query)}`);
  }

  async getProject(id: number) {
    return await api.get(`/projects/${id}`);
  }

  async createProject(params: CreateProjectRequest) {
    return await api.post(`/projects`, params);
  }

  async createProjectFromTemplate(
    templateId: number,
    params: CreateProjectFromTemplateRequest,
  ) {
    return await api.post(`/projects/from-template/${templateId}`, params);
  }

  async duplicateProject(id: number) {
    return await api.post(`/projects/${id}/duplicate`);
  }

  async updateProject(id: number, params: UpdateProjectRequest) {
    return await api.patch(`/projects/${id}`, params);
  }

  async deleteProject(id: number) {
    return await api.delete(`/projects/${id}`);
  }
}

export default new ProjectsApi();
