import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { Template } from './template.entity';
import { Project } from '../projects/project.entity';
import {
  CreateTemplateFromProjectDto,
  CreateTemplateDto,
  TemplateQueryDto,
  TemplateResponseDto,
  UpdateTemplateDto,
} from './dtos';
import type { QueryResponse } from '../../common/types';
import { createJsonDocumentPath, readJsonDocument, writeJsonDocument } from '../../common/utils';
import { ConfigService } from '@nestjs/config';
import { CloudflareR2Service } from '../cloudflare-r2/cloudflare-r2.service';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private configService: ConfigService,
    private cloudflareR2Service: CloudflareR2Service,
  ) {}

  async getAll(query: TemplateQueryDto, authId?: number): Promise<QueryResponse> {
    const { page, limit, search, source, type } = query;
    const queryBuilder = this.templatesRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.author', 'author');

    if (search) {
      queryBuilder.andWhere('LOWER(template.title) LIKE :search', {
        search: `%${search.toLowerCase()}%`,
      });
    }
    if (type) {
      queryBuilder.andWhere('template.type = :type', { type });
    }
    if (source === 'built-in') {
      queryBuilder.andWhere('template.isBuiltIn = :isBuiltIn', { isBuiltIn: true });
    } else if (source === 'custom') {
      if (authId) {
        queryBuilder.andWhere('template.authorId = :authId', { authId });
      } else {
        queryBuilder.andWhere('1 = 0');
      }
    } else if (authId) {
      queryBuilder.andWhere('(template.isBuiltIn = true OR template.authorId = :authId)', {
        authId,
      });
    } else {
      queryBuilder.andWhere('template.isBuiltIn = true');
    }

    const [templates, total] = await queryBuilder
      .orderBy('template.createDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      templates: plainToInstance(TemplateResponseDto, templates),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      filters: [{ search: search ?? null }, { type: type ?? null }, { source }],
    };
  }

  async getOne(id: number, authId?: number): Promise<TemplateResponseDto> {
    const template = await this.templatesRepository.findOne({
      where: { id },
      relations: { author: true },
    });

    if (!template) throw new NotFoundException('Template is not found');
    if (!template.isBuiltIn && template.authorId !== authId) {
      throw new ForbiddenException('You do not have access to this template');
    }

    return plainToInstance(TemplateResponseDto, {
      ...template,
      content:
        this.configService.get('EMAIL_API_AND_CLOUD_FILE_STORAGE') === 'true'
          ? await this.cloudflareR2Service.readJsonDocument(template.file)
          : await readJsonDocument(template.file),
    });
  }

  async createOne(authorId: number, dto: CreateTemplateDto): Promise<TemplateResponseDto> {
    await this.assertProjectBelongsToAuthor(dto.projectId, authorId);

    const file = createJsonDocumentPath('templates');
    if (this.configService.get('EMAIL_API_AND_CLOUD_FILE_STORAGE') === 'true')
      await this.cloudflareR2Service.writeJsonDocument(file, dto.content);
    else await writeJsonDocument(file, dto.content);

    const template = await this.templatesRepository.save(
      this.templatesRepository.create({
        authorId,
        title: dto.title,
        file,
        preview: dto.preview,
        width: dto.width,
        height: dto.height,
        type: dto.type,
        isBuiltIn: false,
        projectId: dto.projectId ?? null,
      }),
    );

    return await this.getOne(template.id, authorId);
  }

  async createOneFromProject(
    authorId: number,
    projectId: number,
    dto: CreateTemplateFromProjectDto,
  ): Promise<TemplateResponseDto> {
    const project = await this.projectsRepository.findOneBy({ id: projectId, authorId });

    if (!project) throw new NotFoundException('Project is not found');

    const content =
      this.configService.get('EMAIL_API_AND_CLOUD_FILE_STORAGE') === 'true'
        ? await this.cloudflareR2Service.readJsonDocument(project.file)
        : await readJsonDocument(project.file);
    const file = createJsonDocumentPath('templates');

    if (this.configService.get('EMAIL_API_AND_CLOUD_FILE_STORAGE') === 'true')
      await this.cloudflareR2Service.writeJsonDocument(file, content);
    else await writeJsonDocument(file, content);

    const template = await this.templatesRepository.save(
      this.templatesRepository.create({
        authorId,
        title: dto.title,
        file,
        preview: project.preview,
        width: project.width,
        height: project.height,
        type: dto.type,
        isBuiltIn: false,
        projectId: project.id,
      }),
    );

    return await this.getOne(template.id, authorId);
  }

  async updateOne(
    id: number,
    authorId: number,
    dto: UpdateTemplateDto,
  ): Promise<TemplateResponseDto> {
    const template = await this.templatesRepository.findOneBy({ id });

    if (!template) throw new NotFoundException('Template is not found');
    if (template.authorId !== authorId)
      throw new ForbiddenException('You cannot edit this template');

    await this.templatesRepository.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.type !== undefined && { type: dto.type }),
    });

    return await this.getOne(id, authorId);
  }

  async deleteOne(id: number, authorId: number): Promise<void> {
    const template = await this.templatesRepository.findOneBy({ id });

    if (!template) throw new NotFoundException('Template is not found');
    if (template.authorId !== authorId)
      throw new ForbiddenException('You cannot delete this template');

    await this.templatesRepository.delete(id);
  }

  private async assertProjectBelongsToAuthor(
    projectId: number | null | undefined,
    authorId: number,
  ): Promise<void> {
    if (projectId === undefined || projectId === null) return;
    if (!(await this.projectsRepository.existsBy({ id: projectId, authorId }))) {
      throw new NotFoundException('Project is not found');
    }
  }
}
