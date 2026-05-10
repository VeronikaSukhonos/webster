import { createQuery } from '@utils/createQuery';

import type { JsonContent, TemplateType } from '@mytypes/responseTypes';

import api from './api';

interface CreateTemplateRequest {
  title: string;
  content: JsonContent;
  preview: string;
  type: TemplateType;
  isBuiltIn?: boolean;
  projectId?: number | null;
}

interface UpdateTemplateRequest {
  title?: string;
  type?: TemplateType;
}

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

  async getTemplate(id: number) {
    return await api.get(`/templates/${id}`);
  }

  async createTemplate(params: CreateTemplateRequest) {
    return await api.post(`/templates`, params);
  }

  async updateTemplate(id: number, params: UpdateTemplateRequest) {
    return await api.patch(`/templates/${id}`, params);
  }

  async deleteTemplate(id: number) {
    return await api.delete(`/templates/${id}`);
  }
}

export default new TemplatesApi();
