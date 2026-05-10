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
import { ProjectsService } from './projects.service';
import { CreateProjectDto, ProjectQueryDto, UpdateProjectDto } from './dtos';
import { Public, User } from '../../common/decorators';
import { AtLeastOneParamPipe, ParseIntWithMessagePipe } from '../../common/pipes';
import type { ApiResponse } from '../../common/types';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Public projects fetch' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, example: 'instagram' })
  @ApiQuery({ name: 'authorId', required: false, example: 1 })
  @ApiOkResponse({
    description: 'Fetched public projects successfully',
    example: {
      statusCode: 200,
      message: 'Fetched public projects successfully',
      data: {
        projects: [
          {
            id: 1,
            authorId: 1,
            title: 'Instagram spring sale post',
            description: 'Draft design for a social media campaign',
            file: 'http://localhost:3000/files/projects/design.json',
            preview: 'http://localhost:3000/files/projects/preview.png',
            isPublic: true,
            createDate: '2026-04-28T18:17:06.813Z',
            editDate: '2026-04-28T18:17:06.813Z',
            templateId: 1,
            author: { id: 1, username: 'user' },
            template: { id: 1, title: 'Instagram Post' },
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
        filters: [{ search: 'instagram' }, { authorId: 1 }],
      },
    },
  })
  @Public()
  @Get('public')
  @HttpCode(HttpStatus.OK)
  async getAllPublic(@Query() query: ProjectQueryDto): Promise<ApiResponse> {
    return {
      message: 'Fetched public projects successfully',
      data: await this.projectsService.getAllPublic(query),
    };
  }

  @ApiOperation({ summary: 'Own projects fetch' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, example: 'spring' })
  @ApiOkResponse({
    description: 'Fetched projects successfully',
    example: {
      statusCode: 200,
      message: 'Fetched projects successfully',
      data: { projects: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } },
    },
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllOwn(
    @User('id') authId: number,
    @Query() query: ProjectQueryDto,
  ): Promise<ApiResponse> {
    return {
      message: 'Fetched projects successfully',
      data: await this.projectsService.getAllByAuthor(authId, query),
    };
  }

  @ApiOperation({ summary: 'Project fetch' })
  @ApiParam({ name: 'id', description: 'Project id', example: 1 })
  @ApiOkResponse({
    description: 'Fetched project successfully',
    example: {
      statusCode: 200,
      message: 'Fetched project successfully',
      data: {
        project: {
          id: 1,
          authorId: 1,
          title: 'Instagram spring sale post',
          description: 'Draft design for a social media campaign',
          file: 'http://localhost:3000/files/projects/design.json',
          preview: 'http://localhost:3000/files/projects/preview.png',
          isPublic: true,
          createDate: '2026-04-28T18:17:06.813Z',
          editDate: '2026-04-28T18:17:06.813Z',
          templateId: 1,
          author: { id: 1, username: 'user' },
          template: { id: 1, title: 'Instagram Post' },
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Project is private and belongs to another user' })
  @ApiNotFoundResponse({ description: 'Project is not found' })
  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getOne(
    @Param('id', new ParseIntWithMessagePipe('Project is not found', HttpStatus.NOT_FOUND))
    id: number,
    @User('id') authId?: number,
  ): Promise<ApiResponse> {
    return {
      message: 'Fetched project successfully',
      data: { project: await this.projectsService.getOne(id, authId) },
    };
  }

  @ApiOperation({ summary: 'Project creation' })
  @ApiBearerAuth()
  @ApiCreatedResponse({
    description: 'Created project successfully',
    example: {
      statusCode: 201,
      message: 'Created project successfully',
      data: {
        project: {
          id: 1,
          authorId: 1,
          title: 'Instagram spring sale post',
          description: 'Draft design for a social media campaign',
          file: 'http://localhost:3000/files/projects/design.json',
          preview: 'http://localhost:3000/files/projects/preview.png',
          isPublic: false,
          createDate: '2026-04-28T18:17:06.813Z',
          editDate: '2026-04-28T18:17:06.813Z',
          templateId: null,
          author: { id: 1, username: 'user' },
          template: null,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid project data',
    example: {
      statusCode: 400,
      message: 'Validation failed',
      errors: [{ param: 'title', error: 'title cannot be empty' }],
    },
  })
  @ApiNotFoundResponse({ description: 'Template is not found' })
  @Post()
  async createOne(@User('id') authId: number, @Body() dto: CreateProjectDto): Promise<ApiResponse> {
    return {
      message: 'Created project successfully',
      data: { project: await this.projectsService.createOne(authId, dto) },
    };
  }

  @ApiOperation({ summary: 'Project update' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Project id', example: 1 })
  @ApiOkResponse({
    description: 'Updated project successfully',
    example: {
      statusCode: 200,
      message: 'Updated project successfully',
      data: {
        project: {
          id: 1,
          authorId: 1,
          title: 'Updated project title',
          description: null,
          file: 'http://localhost:3000/files/projects/design.json',
          preview: 'http://localhost:3000/files/projects/preview.png',
          isPublic: true,
          createDate: '2026-04-28T18:17:06.813Z',
          editDate: '2026-04-28T19:17:06.813Z',
          templateId: null,
          author: { id: 1, username: 'user' },
          template: null,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'No update data or invalid project data',
    example: {
      statusCode: 400,
      message:
        'At least one parameter must be provided: title, description, content, preview, isPublic, templateId',
    },
  })
  @ApiForbiddenResponse({ description: 'Project belongs to another user' })
  @ApiNotFoundResponse({ description: 'Project or template is not found' })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateOne(
    @Param('id', new ParseIntWithMessagePipe('Project is not found', HttpStatus.NOT_FOUND))
    id: number,
    @User('id') authId: number,
    @Body(
      new AtLeastOneParamPipe([
        'title',
        'description',
        'content',
        'preview',
        'isPublic',
        'templateId',
      ]),
    )
    dto: UpdateProjectDto,
  ): Promise<ApiResponse> {
    return {
      message: 'Updated project successfully',
      data: { project: await this.projectsService.updateOne(id, authId, dto) },
    };
  }

  @ApiOperation({ summary: 'Project deletion' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Project id', example: 1 })
  @ApiOkResponse({
    description: 'Deleted project successfully',
    example: {
      statusCode: 200,
      message: 'Deleted project successfully',
    },
  })
  @ApiForbiddenResponse({ description: 'Project belongs to another user' })
  @ApiNotFoundResponse({ description: 'Project is not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteOne(
    @Param('id', new ParseIntWithMessagePipe('Project is not found', HttpStatus.NOT_FOUND))
    id: number,
    @User('id') authId: number,
  ): Promise<ApiResponse> {
    await this.projectsService.deleteOne(id, authId);
    return { message: 'Deleted project successfully' };
  }
}
