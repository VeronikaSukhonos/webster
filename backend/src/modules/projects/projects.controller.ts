import {
  BadRequestException,
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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  CreateProjectFromTemplateDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from './dtos';
import { Public, User } from '../../common/decorators';
import { ParseIntWithMessagePipe } from '../../common/pipes';
import type { ApiResponse } from '../../common/types';

interface ProjectMultipartFiles {
  preview?: Express.Multer.File[];
  uploads?: Express.Multer.File[];
}

const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;

const PROJECT_MULTIPART_CREATE_SCHEMA = {
  schema: {
    type: 'object',
    required: ['title', 'content', 'width', 'height'],
    properties: {
      title: { type: 'string', maxLength: 100, example: 'Instagram spring sale post' },
      description: {
        type: 'string',
        maxLength: 300,
        nullable: true,
        example: 'Draft design for a social media campaign',
      },
      isPublic: { type: 'string', example: 'false' },
      width: { type: 'string', minimum: 40, maximum: 4000, example: '1080' },
      height: { type: 'string', minimum: 40, maximum: 4000, example: '1350' },
      templateId: { type: 'string', nullable: true, example: '1' },
      content: {
        type: 'string',
        description: 'JSON string with project metadata/content',
        example: '{"version":1,"elements":[]}',
      },
      previewPath: {
        type: 'string',
        description: 'Optional existing preview path. Use preview for file upload.',
        example: 'projects/preview.jpg',
      },
      preview: {
        type: 'string',
        format: 'binary',
        description: 'Optional JPG preview image. Default preview is used when omitted.',
      },
      uploads: {
        type: 'array',
        items: { type: 'string', format: 'binary' },
        description: 'Optional image files used in the project content',
      },
      uploadIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Ids of uploaded images in the same order as uploads',
        example: ['2f5c4a63-7a51-4e9f-bc9c-16e1f1f9ac32'],
      },
      imageIds: {
        type: 'string',
        description: 'JSON array of image ids currently referenced by content',
        example: '["2f5c4a63-7a51-4e9f-bc9c-16e1f1f9ac32"]',
      },
    },
  },
};

const PROJECT_MULTIPART_UPDATE_SCHEMA = {
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string', maxLength: 100, example: 'Updated project title' },
      description: { type: 'string', maxLength: 300, nullable: true, example: null },
      isPublic: { type: 'string', example: 'true' },
      width: { type: 'string', minimum: 40, maximum: 4000, example: '1080' },
      height: { type: 'string', minimum: 40, maximum: 4000, example: '1350' },
      templateId: { type: 'string', nullable: true, example: '1' },
      editDate: { type: 'string', format: 'date-time', example: '2026-04-28T19:17:06.813Z' },
      content: {
        type: 'string',
        description: 'JSON string with project metadata/content',
        example: '{"version":1,"elements":[]}',
      },
      previewPath: {
        type: 'string',
        description: 'Optional existing preview path. Use preview for file upload.',
        example: 'projects/preview.jpg',
      },
      preview: { type: 'string', format: 'binary', description: 'JPG preview image' },
      uploads: {
        type: 'array',
        items: { type: 'string', format: 'binary' },
        description: 'Optional new image files used in the project content',
      },
      uploadIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Ids of uploaded images in the same order as uploads',
        example: ['2f5c4a63-7a51-4e9f-bc9c-16e1f1f9ac32'],
      },
      imageIds: {
        type: 'string',
        description: 'JSON array of image ids currently referenced by content',
        example: '["2f5c4a63-7a51-4e9f-bc9c-16e1f1f9ac32"]',
      },
    },
  },
};

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
            file: 'projects/design.json',
            preview: 'projects/preview.png',
            width: 1080,
            height: 1350,
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
  async getAllPublic(
    @Query() query: ProjectQueryDto,
    @User('id') authId?: number,
  ): Promise<ApiResponse> {
    return {
      message: 'Fetched public projects successfully',
      data: await this.projectsService.getAllPublic(query, authId),
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
          file: 'projects/design.json',
          content: { version: 1, elements: [] },
          preview: 'projects/preview.png',
          images: [{ id: '2f5c4a63-7a51-4e9f-bc9c-16e1f1f9ac32', url: '/files/images/image.jpg' }],
          width: 1080,
          height: 1350,
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
  @ApiNotFoundResponse({ description: 'Project is not found or is private' })
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
          file: 'projects/design.json',
          content: { version: 1, elements: [] },
          preview: 'projects/preview.png',
          images: [{ id: '2f5c4a63-7a51-4e9f-bc9c-16e1f1f9ac32', url: '/files/images/image.jpg' }],
          width: 1080,
          height: 1350,
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
  @ApiConsumes('multipart/form-data')
  @ApiBody(PROJECT_MULTIPART_CREATE_SCHEMA)
  @ApiBadRequestResponse({
    description: 'Invalid project data',
    example: {
      statusCode: 400,
      message: 'Validation failed',
      errors: [{ param: 'title', error: 'title cannot be empty' }],
    },
  })
  @ApiForbiddenResponse({ description: 'Template belongs to another user' })
  @ApiNotFoundResponse({ description: 'Template is not found' })
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'preview', maxCount: 1 },
      { name: 'uploads', maxCount: 50 },
    ]),
  )
  async createOne(
    @User('id') authId: number,
    @Body() dto: CreateProjectDto,
    @UploadedFiles()
    files?: ProjectMultipartFiles,
  ): Promise<ApiResponse> {
    const { preview, uploads } = this.validateProjectFiles(files);

    return {
      message: 'Created project successfully',
      data: { project: await this.projectsService.createOne(authId, dto, preview, uploads) },
    };
  }

  @ApiOperation({ summary: 'Project creation from template' })
  @ApiBearerAuth()
  @ApiParam({ name: 'templateId', description: 'Source template id', example: 1 })
  @ApiCreatedResponse({
    description: 'Created project from template successfully',
    example: {
      statusCode: 201,
      message: 'Created project from template successfully',
      data: {
        project: {
          id: 1,
          authorId: 1,
          title: 'Project from Instagram template',
          description: 'Draft design based on a template',
          file: 'projects/35d8fb8a536d97e4a811aa1f.json',
          content: { version: 1, elements: [] },
          preview: 'templates/preview.jpg',
          images: [{ id: '2f5c4a63-7a51-4e9f-bc9c-16e1f1f9ac32', url: '/files/images/image.jpg' }],
          width: 1080,
          height: 1350,
          isPublic: false,
          createDate: '2026-04-28T18:17:06.813Z',
          editDate: '2026-04-28T18:17:06.813Z',
          templateId: 1,
          author: { id: 1, username: 'user' },
          template: { id: 1, title: 'Instagram Post' },
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Template belongs to another user' })
  @ApiNotFoundResponse({ description: 'Template is not found' })
  @Post('from-template/:templateId')
  async createOneFromTemplate(
    @User('id') authId: number,
    @Param('templateId', new ParseIntWithMessagePipe('Template is not found', HttpStatus.NOT_FOUND))
    templateId: number,
    @Body() dto: CreateProjectFromTemplateDto,
  ): Promise<ApiResponse> {
    return {
      message: 'Created project from template successfully',
      data: { project: await this.projectsService.createOneFromTemplate(authId, templateId, dto) },
    };
  }

  @ApiOperation({ summary: 'Project duplication' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Source project id', example: 1 })
  @ApiCreatedResponse({
    description: 'Duplicated project successfully',
    example: {
      statusCode: 201,
      message: 'Duplicated project successfully',
      data: {
        project: {
          id: 2,
          authorId: 1,
          title: 'Instagram spring sale post copy',
          description: 'Draft design for a social media campaign',
          file: 'projects/35d8fb8a536d97e4a811aa1f.json',
          content: { version: 1, elements: [] },
          preview: 'projects/preview.png',
          images: [{ id: '2f5c4a63-7a51-4e9f-bc9c-16e1f1f9ac32', url: '/files/images/image.jpg' }],
          width: 1080,
          height: 1350,
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
  @ApiNotFoundResponse({ description: 'Project is not found' })
  @Post(':id/duplicate')
  async duplicateOne(
    @Param('id', new ParseIntWithMessagePipe('Project is not found', HttpStatus.NOT_FOUND))
    id: number,
    @User('id') authId: number,
  ): Promise<ApiResponse> {
    return {
      message: 'Duplicated project successfully',
      data: { project: await this.projectsService.duplicateOne(id, authId) },
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
          file: 'projects/design.json',
          content: { version: 1, elements: [] },
          preview: 'projects/preview.png',
          images: [{ id: '2f5c4a63-7a51-4e9f-bc9c-16e1f1f9ac32', url: '/files/images/image.jpg' }],
          width: 1080,
          height: 1350,
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
  @ApiConsumes('multipart/form-data')
  @ApiBody(PROJECT_MULTIPART_UPDATE_SCHEMA)
  @ApiBadRequestResponse({
    description: 'No update data or invalid project data',
    example: {
      statusCode: 400,
      message:
        'At least one parameter must be provided: title, description, content, preview, width, height, isPublic, templateId',
    },
  })
  @ApiForbiddenResponse({ description: 'Project or template belongs to another user' })
  @ApiConflictResponse({ description: 'Project has newer changes' })
  @ApiNotFoundResponse({ description: 'Project or template is not found' })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'preview', maxCount: 1 },
      { name: 'uploads', maxCount: 50 },
    ]),
  )
  async updateOne(
    @Param('id', new ParseIntWithMessagePipe('Project is not found', HttpStatus.NOT_FOUND))
    id: number,
    @User('id') authId: number,
    @Body()
    dto: UpdateProjectDto,
    @UploadedFiles()
    files?: ProjectMultipartFiles,
  ): Promise<ApiResponse> {
    const { preview, uploads } = this.validateProjectFiles(files);

    this.assertProjectUpdateHasPayload(dto, preview, uploads);

    return {
      message: 'Updated project successfully',
      data: { project: await this.projectsService.updateOne(id, authId, dto, preview, uploads) },
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

  private assertProjectUpdateHasPayload(
    dto: UpdateProjectDto,
    preview?: Express.Multer.File,
    uploads: Express.Multer.File[] = [],
  ): void {
    const hasBodyUpdate = [
      dto.title,
      dto.description,
      dto.content,
      dto.previewPath,
      dto.width,
      dto.height,
      dto.isPublic,
      dto.templateId,
      dto.uploadIds,
      dto.imageIds,
    ].some((value) => value !== undefined);

    if (!hasBodyUpdate && !preview && uploads.length === 0) {
      throw new BadRequestException(
        'At least one parameter must be provided: title, description, content, preview, uploads, uploadIds, imageIds, width, height, isPublic, templateId',
      );
    }
  }

  private validateProjectFiles(files?: ProjectMultipartFiles): {
    preview?: Express.Multer.File;
    uploads: Express.Multer.File[];
  } {
    const preview = files?.preview?.[0];
    const uploads = files?.uploads ?? [];

    if (preview) {
      this.validateImageFile(
        preview,
        /^image\/jpeg$/,
        'Invalid file format - only JPG (JPEG) is allowed',
      );
    }

    uploads.forEach((upload) =>
      this.validateImageFile(
        upload,
        /^image\/(png|jpeg)$/,
        'Invalid file format - only JPG (JPEG) and PNG are allowed',
      ),
    );

    return { preview, uploads };
  }

  private validateImageFile(
    file: Express.Multer.File,
    fileType: RegExp,
    invalidFormatMessage: string,
  ): void {
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      throw new BadRequestException('Invalid file size - max 10MB');
    }
    if (!fileType.test(file.mimetype)) {
      throw new BadRequestException(invalidFormatMessage);
    }
  }
}
