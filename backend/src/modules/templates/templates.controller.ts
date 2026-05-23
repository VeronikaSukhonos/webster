import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import {
  CreateTemplateDto,
  CreateTemplateFromProjectDto,
  TemplateQueryDto,
  UpdateTemplateDto,
} from './dtos';
import { TEMPLATE_TYPE_ENUM, TEMPLATE_TYPE_EXAMPLE } from './template-type.enum';
import { Public, User } from '../../common/decorators';
import { AtLeastOneParamPipe, ParseIntWithMessagePipe } from '../../common/pipes';
import type { ApiResponse } from '../../common/types';

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @ApiOperation({ summary: 'Templates fetch' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, example: 'facebook' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: TEMPLATE_TYPE_ENUM,
    example: TEMPLATE_TYPE_EXAMPLE,
  })
  @ApiQuery({ name: 'source', required: false, enum: ['all', 'built-in', 'custom'] })
  @ApiOkResponse({
    description: 'Fetched templates successfully',
    example: {
      statusCode: 200,
      message: 'Fetched templates successfully',
      data: {
        templates: [
          {
            id: 1,
            authorId: 1,
            title: 'Minimal birthday invitation',
            file: 'templates/template.json',
            preview: 'templates/preview.png',
            width: 1080,
            height: 1350,
            createDate: '2026-04-28T18:17:06.813Z',
            type: 'invitation',
            isBuiltIn: true,
            projectId: null,
            author: { id: 1, username: 'user' },
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
        filters: [{ search: 'facebook' }, { type: 'facebook-post' }, { source: 'built-in' }],
      },
    },
  })
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Query() query: TemplateQueryDto,
    @User('id') authId?: number,
  ): Promise<ApiResponse> {
    return {
      message: 'Fetched templates successfully',
      data: await this.templatesService.getAll(query, authId),
    };
  }

  @ApiOperation({ summary: 'Last used templates fetch' })
  @ApiOkResponse({
    description: 'Fetched templates successfully',
    example: {
      statusCode: 200,
      message: 'Fetched templates successfully',
      data: {
        templates: [
          {
            id: 1,
            authorId: 1,
            title: 'Minimal birthday invitation',
            file: 'templates/template.json',
            preview: 'templates/preview.png',
            width: 1080,
            height: 1350,
            createDate: '2026-04-28T18:17:06.813Z',
            type: 'invitation',
            isBuiltIn: true,
            projectId: null,
            author: { id: 1, username: 'user' },
          },
        ],
      },
    },
  })
  @Get('recent')
  @HttpCode(HttpStatus.OK)
  async getRecent(@User('id') authId?: number): Promise<ApiResponse> {
    return {
      message: 'Fetched templates successfully',
      data: await this.templatesService.getRecent(authId),
    };
  }

  @ApiOperation({ summary: 'Template fetch' })
  @ApiParam({ name: 'id', description: 'Template id', example: 1 })
  @ApiOkResponse({
    description: 'Fetched template successfully',
    example: {
      statusCode: 200,
      message: 'Fetched template successfully',
      data: {
        template: {
          id: 1,
          authorId: 1,
          title: 'Minimal birthday invitation',
          file: 'templates/template.json',
          content: { version: 1, elements: [] },
          preview: 'templates/preview.png',
          images: [{ id: '2f5c4a63-7a51-4e9f-bc9c-16e1f1f9ac32', url: '/files/images/image.jpg' }],
          width: 1080,
          height: 1350,
          createDate: '2026-04-28T18:17:06.813Z',
          type: 'invitation',
          isBuiltIn: true,
          projectId: null,
          author: { id: 1, username: 'user' },
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Template is custom and belongs to another user' })
  @ApiNotFoundResponse({ description: 'Template is not found' })
  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getOne(
    @Param('id', new ParseIntWithMessagePipe('Template is not found', HttpStatus.NOT_FOUND))
    id: number,
    @User('id') authId?: number,
  ): Promise<ApiResponse> {
    return {
      message: 'Fetched template successfully',
      data: { template: await this.templatesService.getOne(id, authId) },
    };
  }

  @ApiOperation({ summary: 'Template creation' })
  @ApiBearerAuth()
  @ApiCreatedResponse({
    description: 'Created template successfully',
    example: {
      statusCode: 201,
      message: 'Created template successfully',
      data: {
        template: {
          id: 1,
          authorId: 1,
          title: 'Minimal birthday invitation',
          file: 'templates/template.json',
          content: { version: 1, elements: [] },
          preview: 'templates/preview.png',
          images: [{ id: '2f5c4a63-7a51-4e9f-bc9c-16e1f1f9ac32', url: '/files/images/image.jpg' }],
          width: 1080,
          height: 1350,
          createDate: '2026-04-28T18:17:06.813Z',
          type: 'invitation',
          isBuiltIn: false,
          projectId: 1,
          author: { id: 1, username: 'user' },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid template data',
    example: {
      statusCode: 400,
      message: 'Validation failed',
      errors: [{ param: 'title', error: 'title cannot be empty' }],
    },
  })
  @ApiNotFoundResponse({ description: 'Project is not found' })
  @Post()
  async createOne(
    @User('id') authId: number,
    @Body() dto: CreateTemplateDto,
  ): Promise<ApiResponse> {
    return {
      message: 'Created template successfully',
      data: { template: await this.templatesService.createOne(authId, dto) },
    };
  }

  @ApiOperation({ summary: 'Template creation from project' })
  @ApiBearerAuth()
  @ApiParam({ name: 'projectId', description: 'Source project id', example: 1 })
  @ApiCreatedResponse({
    description: 'Created template from project successfully',
    example: {
      statusCode: 201,
      message: 'Created template from project successfully',
      data: {
        template: {
          id: 1,
          authorId: 1,
          title: 'Template from my project',
          file: 'templates/35d8fb8a536d97e4a811aa1f.json',
          content: { version: 1, elements: [] },
          preview: 'projects/preview.jpg',
          images: [{ id: '2f5c4a63-7a51-4e9f-bc9c-16e1f1f9ac32', url: '/files/images/image.jpg' }],
          width: 1080,
          height: 1350,
          createDate: '2026-04-28T18:17:06.813Z',
          type: 'facebook-post',
          isBuiltIn: false,
          projectId: 1,
          author: { id: 1, username: 'user' },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid template data',
    example: {
      statusCode: 400,
      message: 'Validation failed',
      errors: [{ param: 'title', error: 'title cannot be empty' }],
    },
  })
  @ApiNotFoundResponse({ description: 'Project is not found' })
  @Post('from-project/:projectId')
  async createOneFromProject(
    @User('id') authId: number,
    @Param('projectId', new ParseIntWithMessagePipe('Project is not found', HttpStatus.NOT_FOUND))
    projectId: number,
    @Body() dto: CreateTemplateFromProjectDto,
  ): Promise<ApiResponse> {
    return {
      message: 'Created template from project successfully',
      data: { template: await this.templatesService.createOneFromProject(authId, projectId, dto) },
    };
  }

  @ApiOperation({ summary: 'Template update' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Template id', example: 1 })
  @ApiOkResponse({
    description: 'Updated template successfully',
    example: {
      statusCode: 200,
      message: 'Updated template successfully',
      data: {
        template: {
          id: 1,
          authorId: 1,
          title: 'Updated invitation template',
          file: 'templates/template.json',
          content: { version: 1, elements: [] },
          preview: 'templates/preview.png',
          images: [{ id: '2f5c4a63-7a51-4e9f-bc9c-16e1f1f9ac32', url: '/files/images/image.jpg' }],
          width: 1080,
          height: 1350,
          createDate: '2026-04-28T18:17:06.813Z',
          type: 'invitation',
          isBuiltIn: false,
          projectId: 1,
          author: { id: 1, username: 'user' },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'No update data or invalid template data',
    example: {
      statusCode: 400,
      message: 'At least one parameter must be provided: title, type',
    },
  })
  @ApiForbiddenResponse({ description: 'Template belongs to another user' })
  @ApiNotFoundResponse({ description: 'Template is not found' })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateOne(
    @Param('id', new ParseIntWithMessagePipe('Template is not found', HttpStatus.NOT_FOUND))
    id: number,
    @User('id') authId: number,
    @Body(new AtLeastOneParamPipe(['title', 'type']))
    dto: UpdateTemplateDto,
  ): Promise<ApiResponse> {
    return {
      message: 'Updated template successfully',
      data: { template: await this.templatesService.updateOne(id, authId, dto) },
    };
  }

  @ApiOperation({ summary: 'Template deletion' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Template id', example: 1 })
  @ApiOkResponse({
    description: 'Deleted template successfully',
    example: {
      statusCode: 200,
      message: 'Deleted template successfully',
    },
  })
  @ApiForbiddenResponse({ description: 'Template belongs to another user' })
  @ApiNotFoundResponse({ description: 'Template is not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteOne(
    @Param('id', new ParseIntWithMessagePipe('Template is not found', HttpStatus.NOT_FOUND))
    id: number,
    @User('id') authId: number,
  ): Promise<ApiResponse> {
    await this.templatesService.deleteOne(id, authId);
    return { message: 'Deleted template successfully' };
  }
}
