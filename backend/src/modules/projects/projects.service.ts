import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import {
  CreateProjectDto,
  CreateProjectFromTemplateDto,
  ProjectQueryDto,
  ProjectResponseDto,
  UpdateProjectDto,
} from './dtos';
import { Template } from '../templates/template.entity';
import type { QueryResponse } from '../../common/types';
import {
  createJsonDocumentPath,
  JsonDocument,
  readJsonDocument,
  uploadFileToPath,
  writeJsonDocument,
} from '../../common/utils';
import { ConfigService } from '@nestjs/config';
import { CloudflareR2Service } from '../cloudflare-r2/cloudflare-r2.service';
import { DEFAULT_PROJECT_PREVIEW } from '../../common/constants';
import { DocumentImagesService } from '../document-images/document-images.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
    private configService: ConfigService,
    private cloudflareR2Service: CloudflareR2Service,
    private documentImagesService: DocumentImagesService,
  ) {}

  async getAllPublic(query: ProjectQueryDto): Promise<QueryResponse> {
    const { authorId, page, limit, search } = query;
    const queryBuilder = this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.author', 'author')
      .leftJoinAndSelect('project.template', 'template')
      .where('project.isPublic = :isPublic', { isPublic: true });

    if (search) {
      queryBuilder.andWhere('LOWER(project.title) LIKE :search', {
        search: `%${search.toLowerCase()}%`,
      });
    }
    if (authorId) {
      queryBuilder.andWhere('project.authorId = :authorId', { authorId });
    }

    const [projects, total] = await queryBuilder
      .orderBy('project.editDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      projects: plainToInstance(ProjectResponseDto, projects),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      filters: [{ search: search ?? null }, { authorId: authorId ?? null }],
    };
  }

  async getAllByAuthor(authorId: number, query: ProjectQueryDto): Promise<QueryResponse> {
    const { page, limit, search } = query;
    const queryBuilder = this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.author', 'author')
      .leftJoinAndSelect('project.template', 'template')
      .where('project.authorId = :authorId', { authorId });

    if (search) {
      queryBuilder.andWhere('LOWER(project.title) LIKE :search', {
        search: `%${search.toLowerCase()}%`,
      });
    }

    const [projects, total] = await queryBuilder
      .orderBy('project.editDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      projects: plainToInstance(ProjectResponseDto, projects),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      filters: [{ search: search ?? null }],
    };
  }

  async getOne(id: number, authId?: number): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: { author: true, template: true },
    });

    if (!project) throw new NotFoundException('Project is not found');
    if (!project.isPublic && project.authorId !== authId) {
      throw new NotFoundException('Project is not found');
    }

    return plainToInstance(ProjectResponseDto, {
      ...project,
      content: await this.readProjectDocument(project.file),
      images: await this.documentImagesService.getProjectImages(project.id),
    });
  }

  async createOne(
    authorId: number,
    dto: CreateProjectDto,
    previewFile?: Express.Multer.File,
    uploads: Express.Multer.File[] = [],
  ): Promise<ProjectResponseDto> {
    await this.assertTemplateExists(dto.templateId, authorId);

    const project = await this.projectsRepository.save(
      this.projectsRepository.create({
        authorId,
        title: dto.title,
        description: dto.description ?? null,
        file: createJsonDocumentPath('projects'),
        preview: dto.previewPath ?? DEFAULT_PROJECT_PREVIEW,
        width: dto.width,
        height: dto.height,
        isPublic: dto.isPublic ?? false,
        templateId: dto.templateId ?? null,
      }),
    );

    const file = await this.writeProjectDocument(project.id, dto.content);
    const preview = previewFile
      ? await this.uploadProjectPreview(project.id, previewFile)
      : (dto.previewPath ?? DEFAULT_PROJECT_PREVIEW);

    await this.projectsRepository.update(project.id, { file, preview });
    await this.documentImagesService.syncProjectImages(
      project.id,
      uploads,
      dto.uploadIds,
      dto.imageIds,
    );

    return await this.getOwnProject(project.id, authorId);
  }

  async createOneFromTemplate(
    authorId: number,
    templateId: number,
    dto: CreateProjectFromTemplateDto,
  ): Promise<ProjectResponseDto> {
    const template = await this.getAccessibleTemplate(templateId, authorId);
    const content = await this.readProjectDocument(template.file);

    const project = await this.projectsRepository.save(
      this.projectsRepository.create({
        authorId,
        title: dto.title,
        description: dto.description ?? null,
        file: createJsonDocumentPath('projects'),
        preview: template.preview,
        width: template.width,
        height: template.height,
        isPublic: dto.isPublic ?? false,
        templateId: template.id,
      }),
    );

    await this.projectsRepository.update(project.id, {
      file: await this.writeProjectDocument(project.id, content),
    });
    await this.documentImagesService.copyTemplateImagesToProject(template.id, project.id);

    return await this.getOwnProject(project.id, authorId);
  }

  async duplicateOne(id: number, authorId: number): Promise<ProjectResponseDto> {
    const sourceProject = await this.projectsRepository.findOneBy({ id, authorId });

    if (!sourceProject) throw new NotFoundException('Project is not found');

    const content = await this.readProjectDocument(sourceProject.file);

    const project = await this.projectsRepository.save(
      this.projectsRepository.create({
        authorId,
        title: this.createDuplicateTitle(sourceProject.title),
        description: sourceProject.description,
        file: createJsonDocumentPath('projects'),
        preview: sourceProject.preview,
        width: sourceProject.width,
        height: sourceProject.height,
        isPublic: sourceProject.isPublic,
        templateId: sourceProject.templateId,
      }),
    );

    await this.projectsRepository.update(project.id, {
      file: await this.writeProjectDocument(project.id, content),
    });
    await this.documentImagesService.copyProjectImagesToProject(sourceProject.id, project.id);

    return await this.getOwnProject(project.id, authorId);
  }

  async updateOne(
    id: number,
    authorId: number,
    dto: UpdateProjectDto,
    previewFile?: Express.Multer.File,
    uploads: Express.Multer.File[] = [],
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOneBy({ id });

    if (!project) throw new NotFoundException('Project is not found');
    if (project.authorId !== authorId) throw new ForbiddenException('You cannot edit this project');

    this.assertProjectIsNotNewer(project.editDate, dto.editDate);
    await this.assertTemplateExists(dto.templateId, authorId);

    let file = project.file;
    const preview = previewFile
      ? await this.uploadProjectPreview(project.id, previewFile)
      : dto.previewPath;

    if (dto.content !== undefined) {
      file = await this.writeProjectDocument(project.id, dto.content);
    }

    await this.projectsRepository.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description ?? null }),
      ...(dto.content !== undefined && { file }),
      ...(preview !== undefined && { preview }),
      ...(dto.width !== undefined && { width: dto.width }),
      ...(dto.height !== undefined && { height: dto.height }),
      ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      ...(dto.templateId !== undefined && { templateId: dto.templateId }),
    });
    await this.documentImagesService.syncProjectImages(id, uploads, dto.uploadIds, dto.imageIds);

    return await this.getOwnProject(id, authorId);
  }

  async deleteOne(id: number, authorId: number): Promise<void> {
    const project = await this.projectsRepository.findOneBy({ id });

    if (!project) throw new NotFoundException('Project is not found');
    if (project.authorId !== authorId)
      throw new ForbiddenException('You cannot delete this project');

    await this.projectsRepository.delete(id);
  }

  private async getOwnProject(id: number, authorId: number): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({
      where: { id, authorId },
      relations: { author: true, template: true },
    });

    if (!project) throw new NotFoundException('Project is not found');

    return plainToInstance(ProjectResponseDto, {
      ...project,
      content: await this.readProjectDocument(project.file),
      images: await this.documentImagesService.getProjectImages(project.id),
    });
  }

  private async assertTemplateExists(templateId?: number | null, authorId?: number): Promise<void> {
    if (templateId === undefined || templateId === null) return;
    await this.getAccessibleTemplate(templateId, authorId);
  }

  private async getAccessibleTemplate(templateId: number, authorId?: number): Promise<Template> {
    const template = await this.templatesRepository.findOneBy({ id: templateId });

    if (!template) throw new NotFoundException('Template is not found');
    if (!template.isBuiltIn && template.authorId !== authorId) {
      throw new ForbiddenException('You do not have access to this template');
    }

    return template;
  }

  private assertProjectIsNotNewer(currentEditDate: Date, lastKnownEditDate?: string): void {
    if (!lastKnownEditDate) return;

    const lastKnownTime = new Date(lastKnownEditDate).getTime();

    if (currentEditDate.getTime() > lastKnownTime) {
      throw new ConflictException('Project has been updated since it was last fetched');
    }
  }

  private createDuplicateTitle(title: string): string {
    const suffix = ' copy';
    const maxTitleLength = 100;

    if (title.length + suffix.length <= maxTitleLength) return `${title}${suffix}`;

    return `${title.substring(0, maxTitleLength - suffix.length)}${suffix}`;
  }

  private async writeProjectDocument(
    projectId: number,
    content: Record<string, unknown>,
  ): Promise<string> {
    const file = createJsonDocumentPath('projects', projectId);

    if (this.configService.get('EMAIL_API_AND_CLOUD_FILE_STORAGE') === 'true')
      await this.cloudflareR2Service.writeJsonDocument(file, content);
    else await writeJsonDocument(file, content);

    return file;
  }

  private async readProjectDocument(file: string): Promise<JsonDocument> {
    return this.configService.get('EMAIL_API_AND_CLOUD_FILE_STORAGE') === 'true'
      ? await this.cloudflareR2Service.readJsonDocument(file)
      : await readJsonDocument(file);
  }

  private async uploadProjectPreview(
    projectId: number,
    preview: Express.Multer.File,
  ): Promise<string> {
    return this.configService.get('EMAIL_API_AND_CLOUD_FILE_STORAGE') === 'true'
      ? await this.cloudflareR2Service.uploadImageFile(
          preview,
          'projects',
          `project-${projectId}`,
          '.jpg',
        )
      : await uploadFileToPath(preview, 'projects', `project-${projectId}`, '.jpg');
  }
}
