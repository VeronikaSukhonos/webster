import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import type { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { Auth, google } from 'googleapis';
import { generateFromEmail, generateUsername } from 'unique-username-generator';
import { UsersService } from '../users/users.service';
import { TokenService } from '../token/token.service';
import { EmailService } from '../email/email.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './dtos';
import type { JwtPayload } from '../../common/types';
import { parseTime } from '../../common/utils';

@Injectable()
export class AuthService {
  private readonly oauthClient: Auth.OAuth2Client;
  private readonly refreshConfig: {
    maxAge: number;
    httpOnly: boolean;
    sameSite?: 'none';
    secure?: boolean;
    path: string;
  };

  constructor(
    private usersService: UsersService,
    private tokenService: TokenService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    this.oauthClient = new google.auth.OAuth2(
      this.configService.get('VITE_GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('APP_URL'),
    );
    this.refreshConfig = {
      maxAge: parseTime(this.configService.get('REFRESH_TOKEN_TTL') ?? '7d'),
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/api/auth/refresh',
    };
  }

  async register(dto: RegisterDto): Promise<{ user: AuthResponseDto }> {
    const { username, email, password } = dto;
    const errors = [];

    if (await this.usersService.getOne({ username }))
      errors.push({ param: 'username', error: 'unavailable username' });
    if (await this.usersService.getOne({ email }))
      errors.push({ param: 'email', error: 'unavailable email' });
    if (errors.length) throw new ConflictException({ message: 'Unavailable value(s)', errors });

    const user = await this.usersService.createOne({
      username,
      email,
      password: await bcrypt.hash(password, 10),
    });
    const emailToken = await this.tokenService.createToken(
      { id: user.id, email: user.email },
      'CONFIRM',
    );

    await this.usersService.updateOneSensitive(user.id, { emailToken });
    await this.emailService.sendEmailConfirmation(
      { email: user.email, name: user.username },
      emailToken,
    );

    return { user: plainToInstance(AuthResponseDto, { ...user, hasPassword: true }) };
  }

  async login(
    res: Response,
    dto: LoginDto,
  ): Promise<{ user: AuthResponseDto; accessToken: string }> {
    const { username, password } = dto;
    const user =
      (await this.usersService.getOne({ username }, true)) ??
      (await this.usersService.getOne({ email: username }, true));

    if (!user || !(await bcrypt.compare(password, user.password ?? '')))
      throw new UnauthorizedException('Invalid credentials');
    if (user.emailToken)
      throw new ForbiddenException('Email is not confirmed. Please confirm your email first');

    return {
      user: plainToInstance(AuthResponseDto, { ...user, hasPassword: true }),
      accessToken: await this.authenticate(res, {
        id: user.id,
        email: user.email,
      }),
    };
  }

  async loginGoogle(
    res: Response,
    code: string,
  ): Promise<{ user: AuthResponseDto; accessToken: string }> {
    try {
      const { tokens } = await this.oauthClient.getToken(code);

      this.oauthClient.setCredentials(tokens);
    } catch {
      throw new BadRequestException('Error getting tokens from Google');
    }

    const oauth = google.oauth2({ auth: this.oauthClient, version: 'v2' });
    const { data } = await oauth.userinfo.get();

    if (!data.email) throw new BadRequestException('Google token does not provide an email');
    let user = await this.usersService.getOne({ email: data.email }, true);

    if (!user) {
      const base = generateFromEmail(data.email, {
        randomDigits: 0,
        stripLeadingDigits: true,
        leadingFallback: 'user',
      });
      let username = base;

      while (await this.usersService.getOne({ username }))
        username = generateUsername('', 5, 20, base);

      user = await this.usersService.createOne({
        username,
        email: data.email,
        ...(data.picture && { avatar: data.picture }),
        ...(data.id && { googleId: data.id }),
      });
    } else if (!user.googleId) {
      await this.usersService.updateOneSensitive(user.id, { googleId: data.id ?? null });
    }

    return {
      user: plainToInstance(AuthResponseDto, {
        ...user,
        hasPassword: user.password ? true : false,
      }),
      accessToken: await this.authenticate(res, {
        id: user.id,
        email: user.email,
      }),
    };
  }

  async refresh(
    req: Request,
    res: Response,
  ): Promise<{ user: AuthResponseDto; accessToken: string }> {
    const token = req.cookies['refreshToken'] as string;

    if (!token) throw new UnauthorizedException('Refresh token is missing');

    try {
      const payload = await this.tokenService.verifyToken(token, 'REFRESH');
      const user = await this.usersService.getOne({ id: payload.id }, true);

      if (!user || user.refreshToken !== token) {
        if (payload) await this.logout(payload.id, res);
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      return {
        user: plainToInstance(AuthResponseDto, {
          ...user,
          hasPassword: user.password ? true : false,
        }),
        accessToken: await this.authenticate(res, {
          id: user.id,
          email: user.email,
        }),
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(authId: number, res: Response): Promise<void> {
    await this.usersService.updateOneSensitive(authId, { refreshToken: null });
    res.clearCookie('refreshToken', this.refreshConfig);
  }

  async requestEmailConfirmation(email: string): Promise<void> {
    const user = await this.usersService.getOne({ email }, true);

    if (!user || !user.emailToken)
      throw new NotFoundException('Unconfirmed user with this email is not found');

    const emailToken = await this.tokenService.createToken(
      { id: user.id, email: user.email },
      'CONFIRM',
    );

    await this.usersService.updateOneSensitive(user.id, { emailToken });
    await this.emailService.sendEmailConfirmation(
      { email: user.email, name: user.username },
      emailToken,
    );
  }

  async confirmEmail(token: string): Promise<void> {
    try {
      const payload = await this.tokenService.verifyToken(token, 'CONFIRM');
      const user = await this.usersService.getOne({ id: payload.id }, true);

      if (!user || user.emailToken !== token)
        throw new BadRequestException('Invalid or expired email token');

      await this.usersService.updateOneSensitive(user.id, { emailToken: null });
    } catch {
      throw new BadRequestException('Invalid or expired email token');
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.getOne({ email });

    if (!user) throw new NotFoundException('User with this email is not found');

    const passwordToken = await this.tokenService.createToken(
      { id: user.id, email: user.email },
      'CONFIRM',
    );

    await this.usersService.updateOneSensitive(user.id, { passwordToken });
    await this.emailService.sendPasswordReset(
      { email: user.email, name: user.username },
      passwordToken,
    );
  }

  async resetPassword(token: string, password: string): Promise<void> {
    try {
      const payload = await this.tokenService.verifyToken(token, 'CONFIRM');
      const user = await this.usersService.getOne({ id: payload.id }, true);

      if (!user || user.passwordToken !== token)
        throw new BadRequestException('Invalid or expired password token');
      await this.usersService.updateOneSensitive(user.id, {
        password: await bcrypt.hash(password, 10),
        passwordToken: null,
      });
    } catch {
      throw new BadRequestException('Invalid or expired password token');
    }
  }

  private async authenticate(res: Response, user: JwtPayload): Promise<string> {
    const refreshToken = await this.tokenService.createToken(user, 'REFRESH');

    await this.usersService.updateOneSensitive(user.id, { refreshToken });
    res.cookie('refreshToken', refreshToken, this.refreshConfig);

    return await this.tokenService.createToken(user, 'ACCESS');
  }
}
