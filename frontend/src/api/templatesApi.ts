import { createQuery } from '@utils/utils';

import type { TemplateType } from '@mytypes/responseTypes';

import api from './api';

interface CreateTemplateFromProjectRequest {
  title: string;
  type: TemplateType;
}

interface UpdateTemplateRequest extends Partial<CreateTemplateFromProjectRequest> {}

class TemplatesApi {
  async getTemplates(query?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: TemplateType;
    source?: 'all' | 'built-in' | 'custom';
  }) {
    return await api.get(`/templates/${createQuery(query)}`);
  }

  async getRecentTemplates() {
    return await api.get(`/templates/recent`);
  }

  async getTemplate(id: number) {
    return await api.get(`/templates/${id}`);
  }

  async createTemplateFromProject(projectId: number, params: CreateTemplateFromProjectRequest) {
    return await api.post(`/templates/from-project/${projectId}`, params);
  }

  async updateTemplate(id: number, params: UpdateTemplateRequest) {
    return await api.patch(`/templates/${id}`, params);
  }

  async deleteTemplate(id: number) {
    return await api.delete(`/templates/${id}`);
  }
}

export default new TemplatesApi();
