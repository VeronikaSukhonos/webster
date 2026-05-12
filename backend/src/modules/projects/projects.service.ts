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
  isJsonDocumentPath,
  readJsonDocument,
  writeJsonDocument,
} from '../../common/utils';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
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
      throw new ForbiddenException('You do not have access to this project');
    }

    return plainToInstance(ProjectResponseDto, {
      ...project,
      content: await readJsonDocument(project.file),
    });
  }

  async createOne(authorId: number, dto: CreateProjectDto): Promise<ProjectResponseDto> {
    await this.assertTemplateExists(dto.templateId, authorId);

    const file = createJsonDocumentPath('projects');
    await writeJsonDocument(file, dto.content);

    const project = await this.projectsRepository.save(
      this.projectsRepository.create({
        authorId,
        title: dto.title,
        description: dto.description ?? null,
        file,
        preview: dto.preview,
        width: dto.width,
        height: dto.height,
        isPublic: dto.isPublic ?? false,
        templateId: dto.templateId ?? null,
      }),
    );

    return await this.getOwnProject(project.id, authorId);
  }

  async createOneFromTemplate(
    authorId: number,
    templateId: number,
    dto: CreateProjectFromTemplateDto,
  ): Promise<ProjectResponseDto> {
    const template = await this.getAccessibleTemplate(templateId, authorId);
    const content = await readJsonDocument(template.file);
    const file = createJsonDocumentPath('projects');

    await writeJsonDocument(file, content);

    const project = await this.projectsRepository.save(
      this.projectsRepository.create({
        authorId,
        title: dto.title,
        description: dto.description ?? null,
        file,
        preview: template.preview,
        width: template.width,
        height: template.height,
        isPublic: dto.isPublic ?? false,
        templateId: template.id,
      }),
    );

    return await this.getOwnProject(project.id, authorId);
  }

  async duplicateOne(id: number, authorId: number): Promise<ProjectResponseDto> {
    const sourceProject = await this.projectsRepository.findOneBy({ id, authorId });

    if (!sourceProject) throw new NotFoundException('Project is not found');

    const content = await readJsonDocument(sourceProject.file);
    const file = createJsonDocumentPath('projects');

    await writeJsonDocument(file, content);

    const project = await this.projectsRepository.save(
      this.projectsRepository.create({
        authorId,
        title: this.createDuplicateTitle(sourceProject.title),
        description: sourceProject.description,
        file,
        preview: sourceProject.preview,
        width: sourceProject.width,
        height: sourceProject.height,
        isPublic: sourceProject.isPublic,
        templateId: sourceProject.templateId,
      }),
    );

    return await this.getOwnProject(project.id, authorId);
  }

  async updateOne(
    id: number,
    authorId: number,
    dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOneBy({ id });

    if (!project) throw new NotFoundException('Project is not found');
    if (project.authorId !== authorId) throw new ForbiddenException('You cannot edit this project');

    this.assertProjectIsNotNewer(project.editDate, dto.editDate);
    await this.assertTemplateExists(dto.templateId, authorId);

    let file = project.file;

    if (dto.content !== undefined) {
      if (!isJsonDocumentPath(file, 'projects')) {
        file = createJsonDocumentPath('projects');
      }
      await writeJsonDocument(file, dto.content);
    }

    await this.projectsRepository.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description ?? null }),
      ...(dto.content !== undefined && { file }),
      ...(dto.preview !== undefined && { preview: dto.preview }),
      ...(dto.width !== undefined && { width: dto.width }),
      ...(dto.height !== undefined && { height: dto.height }),
      ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      ...(dto.templateId !== undefined && { templateId: dto.templateId }),
    });

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
      content: await readJsonDocument(project.file),
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
}
