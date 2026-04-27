import { Controller, Post, Body, Param, HttpCode, HttpStatus, Req, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  LoginGoogleDto,
  AuthRequestLinkDto,
  ResetPasswordDto,
} from './dtos';
import type { ApiResponse } from '../../common/types';
import { Public, User } from '../../common/decorators';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Registration',
    description:
      "Registers a new user on the service. Sends an email confirmation link to the user's email",
  })
  @ApiCreatedResponse({
    description: 'Successful registration',
    example: {
      statusCode: 201,
      message: 'Registered successfully. Please check your email to confirm it',
      data: {
        user: {
          id: 1,
          username: 'user',
          email: 'user@gmail.com',
          avatar: 'http://localhost:3000/files/avatars/default-avatar.png',
          about: null,
          registerDate: '2026-04-27T18:17:06.813Z',
          hasPassword: true,
          googleId: null,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid values for registration',
    example: {
      statusCode: 400,
      message: 'Validation failed',
      errors: [
        {
          param: 'password',
          error: 'password must be longer than 8 characters (A-Z, a-z, 0-9)',
        },
      ],
    },
  })
  @ApiConflictResponse({
    description: 'Username or email already exists',
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
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<ApiResponse> {
    return {
      message: 'Registered successfully. Please check your email to confirm it',
      data: await this.authService.register(dto),
    };
  }

  @ApiOperation({
    summary: 'Login',
    description:
      'Logs a registered user in - issues a pair of access and refresh tokens. Only for confirmed users',
  })
  @ApiOkResponse({
    description: 'Successful login',
    example: {
      statusCode: 200,
      message: 'Logged in successfully',
      data: {
        user: {
          id: 1,
          username: 'user',
          email: 'user@gmail.com',
          avatar: 'http://localhost:3000/files/avatars/default-avatar.png',
          about: null,
          registerDate: '2026-04-27T18:17:06.813Z',
          hasPassword: true,
          googleId: null,
        },
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiZW1haWwiOiJmcmllbmQxQGdtYWlsLmNvbSIsImlhdCI6MTc3MzE2NTk2MywiZXhwIjoxNzczMTY2ODYzfQ.62JEhMpI_I06hvb-Kfw8RIRXgEl1r8X79af2jZag3A4',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    example: {
      statusCode: 401,
      message: 'Invalid credentials',
    },
  })
  @ApiForbiddenResponse({
    description: 'User did not confirmed their email',
    example: {
      statusCode: 403,
      message: 'Email is not confirmed. Please confirm your email first',
    },
  })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginDto,
  ): Promise<ApiResponse> {
    return {
      message: 'Logged in successfully',
      data: await this.authService.login(res, dto),
    };
  }

  @ApiOperation({
    summary: 'Login with Google Account',
    description:
      'Logs a user in using OAuth 2.0 - issues a pair of access and refresh tokens. If the user does not exist, they are registered first and then logged in',
  })
  @ApiOkResponse({
    description: 'Successful login',
    example: {
      statusCode: 200,
      message: 'Logged in successfully',
      data: {
        user: {
          id: 1,
          username: 'user',
          email: 'user@gmail.com',
          avatar: 'http://localhost:3000/files/avatars/default-avatar.png',
          about: null,
          registerDate: '2026-04-27T18:17:06.813Z',
          hasPassword: true,
          googleId: '12345678901234567890',
        },
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiZW1haWwiOiJmcmllbmQxQGdtYWlsLmNvbSIsImlhdCI6MTc3MzE2NTk2MywiZXhwIjoxNzczMTY2ODYzfQ.62JEhMpI_I06hvb-Kfw8RIRXgEl1r8X79af2jZag3A4',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Unable to get tokens from the Google Authorization Server',
    example: {
      statusCode: 400,
      message: 'Error getting tokens from Google',
    },
  })
  @Public()
  @Post('login-google')
  @HttpCode(HttpStatus.OK)
  async loginGoogle(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginGoogleDto,
  ): Promise<ApiResponse> {
    return {
      message: 'Logged in successfully',
      data: await this.authService.loginGoogle(res, dto.code),
    };
  }

  @ApiOperation({
    summary: 'Token refresh',
    description:
      'Issues a new pair of access and refresh tokens using a valid refresh token from cookie',
  })
  @ApiOkResponse({
    description: 'Successful refresh',
    example: {
      statusCode: 200,
      message: 'Refreshed tokens successfully',
      data: {
        user: {
          id: 1,
          username: 'user',
          email: 'user@gmail.com',
          avatar: 'http://localhost:3000/files/avatars/default-avatar.png',
          about: null,
          registerDate: '2026-04-27T18:17:06.813Z',
          hasPassword: true,
          googleId: null,
        },
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiZW1haWwiOiJmcmllbmQxQGdtYWlsLmNvbSIsImlhdCI6MTc3MzE2NTk2MywiZXhwIjoxNzczMTY2ODYzfQ.62JEhMpI_I06hvb-Kfw8RIRXgEl1r8X79af2jZag3A4',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
    example: {
      statusCode: 401,
      message: 'Invalid or expired refresh token',
    },
  })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse> {
    return {
      message: 'Refreshed tokens successfully',
      data: await this.authService.refresh(req, res),
    };
  }

  @ApiOperation({
    summary: 'Logout',
    description: 'Logs an authorized user out',
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Successful logout',
    example: {
      statusCode: 200,
      message: 'Logged out successfully',
    },
  })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @User('id') authId: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse> {
    await this.authService.logout(authId, res);
    return { message: 'Logged out successfully' };
  }

  @ApiOperation({
    summary: 'Email confirmation request',
    description:
      "Resends an email confirmation link to the user's email if the user is not confirmed",
  })
  @ApiOkResponse({
    description: 'Successful request',
    example: {
      statusCode: 200,
      message: 'Email confirmation link has been sent. Please check your email',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid value for email',
    example: {
      statusCode: 400,
      message: 'Validation failed',
      errors: [
        {
          param: 'email',
          error: 'email is required',
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'User is not found',
    example: {
      statusCode: 404,
      message: 'Unconfirmed user with this email is not found',
    },
  })
  @Public()
  @Post('email-confirmation')
  @HttpCode(HttpStatus.OK)
  async requestEmailConfirmation(@Body() dto: AuthRequestLinkDto): Promise<ApiResponse> {
    await this.authService.requestEmailConfirmation(dto.email);
    return {
      message: 'Email confirmation link has been sent. Please check your email',
    };
  }

  @ApiOperation({
    summary: 'Email confirmation',
    description: "Confirms a user's email address using a token sent to their email",
  })
  @ApiParam({
    name: 'token',
    description: "Token from the link sent to the user's email",
  })
  @ApiOkResponse({
    description: 'Successful confirmation',
    example: {
      statusCode: 200,
      message: 'Email has been confirmed successfully',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid token',
    example: {
      statusCode: 400,
      message: 'Invalid or expired email token',
    },
  })
  @Public()
  @Post('email-confirmation/:token')
  @HttpCode(HttpStatus.OK)
  async confirmEmail(@Param('token') token: string): Promise<ApiResponse> {
    await this.authService.confirmEmail(token);
    return {
      message: 'Email has been confirmed successfully',
    };
  }

  @ApiOperation({
    summary: 'Password reset request',
    description: "Sends a password reset link to the user's email",
  })
  @ApiOkResponse({
    description: 'Successful request',
    example: {
      statusCode: 200,
      message: 'Password reset link has been sent. Please check your email',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid value for email',
    example: {
      statusCode: 400,
      message: 'Validation failed',
      errors: [
        {
          param: 'email',
          error: 'email must be valid',
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'User is not found',
    example: {
      statusCode: 404,
      message: 'User with this email is not found',
    },
  })
  @Public()
  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() dto: AuthRequestLinkDto): Promise<ApiResponse> {
    await this.authService.requestPasswordReset(dto.email);
    return {
      message: 'Password reset link has been sent. Please check your email',
    };
  }

  @ApiOperation({
    summary: 'Password reset',
    description: "Resets a user's password using a token sent to their email",
  })
  @ApiParam({
    name: 'token',
    description: "Token from the link sent to the user's email",
  })
  @ApiOkResponse({
    description: 'Successful reset',
    example: {
      statusCode: 200,
      message: 'Password has been reset successfully',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid token',
    example: {
      statusCode: 400,
      message: 'Invalid or expired password token',
    },
  })
  @Public()
  @Post('password-reset/:token')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('token') token: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<ApiResponse> {
    await this.authService.resetPassword(token, dto.password);
    return {
      message: 'Password has been reset successfully',
    };
  }
}
