import { createQuery } from '@utils/createQuery';

import type { Canvas, ImageItem, Size } from '@mytypes/editorTypes';

import api from './api';

interface CreateProjectRequest {
  title: string;
  size: Size;
  content?: Canvas;
  uploads?: ImageItem[];
  images?: ImageItem[];
}

interface CreateProjectFromTemplateRequest {
  title: string;
}

interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  preview?: File;
  description?: string | null;
  isPublic?: boolean;
  editDate: string;
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
    return await api.post(`/projects`, this.createFd(params), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async createProjectFromTemplate(templateId: number, params: CreateProjectFromTemplateRequest) {
    return await api.post(`/projects/from-template/${templateId}`, params);
  }

  async duplicateProject(id: number) {
    return await api.post(`/projects/${id}/duplicate`);
  }

  async updateProject(id: number, params: UpdateProjectRequest) {
    return await api.patch(`/projects/${id}`, this.createFd(params), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async deleteProject(id: number) {
    return await api.delete(`/projects/${id}`);
  }

  private createFd(params: any) {
    const fd = new FormData();
    const uploads =
      params.uploads ??
      params.images?.filter((img: ImageItem) => img.urlSource === 'local' && img.file);

    if (params.title) fd.append('title', params.title);
    if (params.description !== undefined && params.description !== null)
      fd.append('description', params.description);
    if (params.size) {
      fd.append('width', params.size.width.toString());
      fd.append('height', params.size.height.toString());
    }
    if (params.content) fd.append('content', JSON.stringify(params.content));
    if (params.preview) fd.append('preview', params.preview);
    if (uploads?.length)
      for (const img of uploads) {
        fd.append('uploads', img.file);
        fd.append('uploadIds', img.id);
      }
    if (params.images)
      fd.append('imageIds', JSON.stringify(params.images.map((i: ImageItem) => i.id)));
    if (params.isPublic !== undefined) fd.append('isPublic', params.isPublic.toString());
    if (params.editDate) fd.append('editDate', params.editDate);

    return fd;
  }
}

export default new ProjectsApi();
