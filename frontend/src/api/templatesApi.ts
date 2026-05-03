import { createQuery } from '@utils/createQuery';

// import type { CreateTemplateParams, UpdateTemplateParams } from '@mytypes/formParams';

import api from './api';

class TemplatesApi {
  async getBuiltInTemplates(query?: { page?: number; limit?: number; title?: string }) {
    return await api.get(`/templates/${createQuery(query)}`);
  }

  async getOwnTemplates(query?: { page?: number; limit?: number; title?: string }) {
    return await api.get(`/templates/own/${createQuery(query)}`);
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
