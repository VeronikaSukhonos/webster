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
import { CreateTemplateDto, UpdateTemplateDto } from './dtos';
import { Public, User } from '../../common/decorators';
import { AtLeastOneParamPipe, ParseIntWithMessagePipe } from '../../common/pipes';
import type { ApiResponse } from '../../common/types';

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @ApiOperation({ summary: 'Templates fetch' })
  @ApiQuery({ name: 'type', required: false, example: 'instagram-post' })
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
            file: 'http://localhost:3000/files/templates/template.json',
            createDate: '2026-04-28T18:17:06.813Z',
            type: 'invitation',
          },
        ],
      },
    },
  })
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(@Query('type') type?: string): Promise<ApiResponse> {
    return {
      message: 'Fetched templates successfully',
      data: { templates: await this.templatesService.getAll(type) },
    };
  }

  @ApiOperation({ summary: 'Own templates fetch' })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Fetched own templates successfully',
    example: {
      statusCode: 200,
      message: 'Fetched own templates successfully',
      data: { templates: [] },
    },
  })
  @Get('own')
  @HttpCode(HttpStatus.OK)
  async getAllOwn(@User('id') authId: number): Promise<ApiResponse> {
    return {
      message: 'Fetched own templates successfully',
      data: { templates: await this.templatesService.getAllByAuthor(authId) },
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
          file: 'http://localhost:3000/files/templates/template.json',
          createDate: '2026-04-28T18:17:06.813Z',
          type: 'invitation',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Template is not found' })
  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getOne(
    @Param('id', new ParseIntWithMessagePipe('Template is not found', HttpStatus.NOT_FOUND))
    id: number,
  ): Promise<ApiResponse> {
    return {
      message: 'Fetched template successfully',
      data: { template: await this.templatesService.getOne(id) },
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
          file: 'http://localhost:3000/files/templates/template.json',
          createDate: '2026-04-28T18:17:06.813Z',
          type: 'invitation',
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
          file: 'http://localhost:3000/files/templates/template.json',
          createDate: '2026-04-28T18:17:06.813Z',
          type: 'invitation',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'No update data or invalid template data',
    example: {
      statusCode: 400,
      message: 'At least one parameter must be provided: title, file, type',
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
    @Body(new AtLeastOneParamPipe(['title', 'file', 'type'])) dto: UpdateTemplateDto,
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
