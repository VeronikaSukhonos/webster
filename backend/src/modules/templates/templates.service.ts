import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { Template } from './template.entity';
import {
  CreateTemplateDto,
  TemplateQueryDto,
  TemplateResponseDto,
  UpdateTemplateDto,
} from './dtos';
import type { QueryResponse } from '../../common/types';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
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

  async getOne(id: number): Promise<TemplateResponseDto> {
    const template = await this.templatesRepository.findOne({
      where: { id },
      relations: { author: true },
    });

    if (!template) throw new NotFoundException('Template is not found');

    return plainToInstance(TemplateResponseDto, template);
  }

  async createOne(authorId: number, dto: CreateTemplateDto): Promise<TemplateResponseDto> {
    const template = await this.templatesRepository.save(
      this.templatesRepository.create({ ...dto, authorId, isBuiltIn: dto.isBuiltIn ?? false }),
    );

    return await this.getOne(template.id);
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

    await this.templatesRepository.update(id, dto);

    return await this.getOne(id);
  }

  async deleteOne(id: number, authorId: number): Promise<void> {
    const template = await this.templatesRepository.findOneBy({ id });

    if (!template) throw new NotFoundException('Template is not found');
    if (template.authorId !== authorId)
      throw new ForbiddenException('You cannot delete this template');

    await this.templatesRepository.delete(id);
  }
}
