import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { Template } from './template.entity';
import { CreateTemplateDto, TemplateResponseDto, UpdateTemplateDto } from './dtos';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
  ) {}

  async getAll(type?: string): Promise<TemplateResponseDto[]> {
    const templates = await this.templatesRepository.find({
      where: { ...(type && { type }) },
      relations: { author: true },
      order: { createDate: 'DESC' },
    });

    return plainToInstance(TemplateResponseDto, templates);
  }

  async getAllByAuthor(authorId: number): Promise<TemplateResponseDto[]> {
    const templates = await this.templatesRepository.find({
      where: { authorId },
      order: { createDate: 'DESC' },
    });

    return plainToInstance(TemplateResponseDto, templates);
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
      this.templatesRepository.create({ ...dto, authorId }),
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
