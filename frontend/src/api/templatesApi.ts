import { createQuery } from '@utils/createQuery';

// import type { CreateTemplateParams, UpdateTemplateParams } from '@mytypes/formParams';

import api from './api';

class TemplatesApi {
  async getTemplates(query?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    source?: 'all' | 'built-in' | 'custom';
  }) {
    return await api.get(`/templates/${createQuery(query)}`);
  }

  async getTemplate(id: number) {
    return await api.get(`/templates/${id}`);
  }

  // async createTemplate(params: CreateTemplateParams) {
  //   return await api.post(`/templates`, params);
  // }

  // async updateTemplate(id: number, params: UpdateTemplateParams) {
  //   return await api.patch(`/templates/${id}`, params);
  // }

  async deleteTemplate(id: number) {
    return await api.delete(`/templates/${id}`);
  }
}

export default new TemplatesApi();
