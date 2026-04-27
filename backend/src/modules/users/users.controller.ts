import {
  Controller,
  Body,
  Patch,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  Delete,
  Get,
  Param,
  ForbiddenException,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public, User } from '../../common/decorators';
import {
  AtLeastOneParamPipe,
  FileValidationPipe,
  ParseIntWithMessagePipe,
} from '../../common/pipes';
import { ApiResponse } from '../../common/types';
import { AvatarUploadDto, UpdateUserPasswordDto, UpdateUserProfileDto } from './dtos';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'User profile fetch',
    description:
      "Fetches the user's profile data (email, hasPassword and googleId are returned only for an authenticated user)",
  })
  @ApiOkResponse({
    description: 'Successful user profile fetch',
    example: {
      statusCode: 200,
      message: "Fetched user's data successfully",
      data: {
        user: {
          id: 1,
          username: 'user',
          email: 'user@gmail.com',
          avatar: 'http://localhost:3000/files/avatars/default-avatar.png',
          about: 'Love creating presentations',
          registerDate: '2026-04-27T18:17:06.813Z',
          hasPassword: true,
          googleId: null,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User is not found',
    example: {
      statusCode: 404,
      message: 'User is not found',
    },
  })
  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getOneProfile(
    @Param('id', new ParseIntWithMessagePipe('User is not found', HttpStatus.NOT_FOUND))
    id: number,
    @User('id') authId: number,
  ): Promise<ApiResponse> {
    return {
      message: "Fetched user's data successfully",
      data: { user: await this.usersService.getOneProfile(id, authId) },
    };
  }

  @ApiOperation({
    summary: 'Profile update',
    description: "Updates the user's profile - username, about",
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Successful profile update (example: about section update)',
    example: {
      statusCode: 200,
      message: 'Updated profile successfully',
      data: {
        user: {
          id: 1,
          username: 'user',
          email: 'user@gmail.com',
          avatar: 'http://localhost:3000/files/avatars/default-avatar.png',
          about: 'Love creating postcards',
          registerDate: '2026-04-27T18:17:06.813Z',
          hasPassword: true,
          googleId: null,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'No profile data was updated',
    example: {
      statusCode: 200,
      message: 'Nothing has changed',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid values for username update',
    example: {
      statusCode: 400,
      message: 'Validation failed',
      errors: [{ param: 'username', error: 'username must contain only letters and digits' }],
    },
  })
  @ApiConflictResponse({
    description: 'Trying to update username to one that already exists',
    example: {
      statusCode: 409,
      message: 'Unavailable value(s)',
      errors: [
        {
          param: 'username',
          error: 'unavailable username',
        },
      ],
    },
  })
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @User('id') authId: number,
    @Body(new AtLeastOneParamPipe(['username', 'about']))
    dto: UpdateUserProfileDto,
  ): Promise<ApiResponse> {
    const updated = await this.usersService.updateOneProfile(authId, dto);

    if (updated) {
      return {
        message: 'Updated profile successfully',
        data: { user: updated },
      };
    } else {
      return { message: 'Nothing has changed' };
    }
  }

  @ApiOperation({
    summary: 'Password update',
    description: "Updates the user's password or sets it for Google-registered users",
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Successful password update',
    example: {
      statusCode: 200,
      message: 'Updated password successfully',
    },
  })
  @ApiBadRequestResponse({
    description:
      'Current password is not provided (required only for username/password-registered users)',
    example: {
      statusCode: 400,
      message: 'Validation failed',
      errors: [{ param: 'currentPassword', error: 'current password is required' }],
    },
  })
  @ApiForbiddenResponse({
    description: 'Invalid current password (required only for username/password-registered users)',
    example: {
      statusCode: 403,
      message: 'Invalid current password',
    },
  })
  @Patch('password')
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @User('id') authId: number,
    @Body() dto: UpdateUserPasswordDto,
  ): Promise<ApiResponse> {
    await this.usersService.updateOnePassword(authId, dto);

    return { message: 'Updated password successfully' };
  }

  @ApiOperation({
    summary: 'User avatar upload',
    description: "Uploads the user's avatar",
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Single avatar - jpg (jpeg) or png, up to 5MB',
    type: AvatarUploadDto,
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Successful avatar upload',
    example: {
      statusCode: 200,
      message: 'Uploaded avatar successfully',
      data: {
        avatar: 'http://localhost:3000/files/avatars/c803084a39ddabefa5c41773866510378.png',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'File with invalid size was provided',
    example: {
      statusCode: 400,
      message: 'Invalid file size - max 5MB',
    },
  })
  @Patch('avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @User('id') authId: number,
    @UploadedFile(new FileValidationPipe())
    avatar: Express.Multer.File,
  ) {
    return {
      message: 'Uploaded avatar successfully',
      data: { avatar: await this.usersService.uploadOneAvatar(authId, avatar) },
    };
  }

  @ApiOperation({
    summary: 'User avatar deletion',
    description: "Deletes the user's avatar",
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Successful avatar deletion',
    example: {
      statusCode: 200,
      message: 'Deleted avatar successfully',
      data: { avatar: 'http://localhost:3000/files/avatars/default-avatar.png' },
    },
  })
  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  async deleteAvatar(@User('id') authId: number) {
    return {
      message: 'Deleted avatar successfully',
      data: { avatar: await this.usersService.deleteOneAvatar(authId) },
    };
  }

  @ApiOperation({
    summary: 'Account deletion request',
    description: "Sends an account deletion link to the user's email",
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Successful request',
    example: {
      statusCode: 200,
      message: 'Account deletion link has been sent. Please check your email',
    },
  })
  @Post()
  @HttpCode(HttpStatus.OK)
  async requestDeletion(@User('id') authId: number): Promise<ApiResponse> {
    await this.usersService.requestAccountDeletion(authId);
    return {
      message: 'Account deletion link has been sent. Please check your email',
    };
  }

  @ApiOperation({
    summary: 'Account Deletion',
    description: 'Deletes user account using a token sent to their email',
  })
  @ApiParam({
    name: 'token',
    description: "Token from the link sent to the user's email",
  })
  @ApiOkResponse({
    description: 'Successful deletion',
    example: {
      statusCode: 200,
      message: 'Deleted account successfully',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid token',
    example: {
      statusCode: 400,
      message: 'Invalid or expired deletion token',
    },
  })
  @Delete(':token')
  @HttpCode(HttpStatus.OK)
  async deleteOne(@Param('token') token: string): Promise<ApiResponse> {
    await this.usersService.deleteOne(token);
    return { message: 'Deleted account successfully' };
  }
}
