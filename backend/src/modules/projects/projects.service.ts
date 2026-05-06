import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto, ProjectQueryDto, ProjectResponseDto, UpdateProjectDto } from './dtos';
import { Template } from '../templates/template.entity';
import type { QueryResponse } from '../../common/types';

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

    return plainToInstance(ProjectResponseDto, project);
  }

  async createOne(authorId: number, dto: CreateProjectDto): Promise<ProjectResponseDto> {
    await this.assertTemplateExists(dto.templateId);

    const project = await this.projectsRepository.save(
      this.projectsRepository.create({
        ...dto,
        authorId,
        description: dto.description ?? null,
        isPublic: dto.isPublic ?? false,
        templateId: dto.templateId ?? null,
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

    await this.assertTemplateExists(dto.templateId);

    await this.projectsRepository.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description ?? null }),
      ...(dto.file !== undefined && { file: dto.file }),
      ...(dto.preview !== undefined && { preview: dto.preview }),
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

    return plainToInstance(ProjectResponseDto, project);
  }

  private async assertTemplateExists(templateId?: number | null): Promise<void> {
    if (templateId === undefined || templateId === null) return;
    if (!(await this.templatesRepository.existsBy({ id: templateId }))) {
      throw new NotFoundException('Template is not found');
    }
  }
}
