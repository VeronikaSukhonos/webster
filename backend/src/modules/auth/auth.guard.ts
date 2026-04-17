import { Reflector } from '@nestjs/core';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UsersService } from '../users/users.service';
import type { JwtPayload } from '../../common/types';
import { IS_PUBLIC } from '../../common/decorators';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic: boolean = this.reflector.getAllAndOverride(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const req: Request = ctx.switchToHttp().getRequest();
    const [type, token] = req.headers.authorization?.split(' ') ?? [];

    if (!isPublic && (type !== 'Bearer' || !token)) {
      throw new UnauthorizedException('Bearer access token is missing');
    }
    if (token) {
      const message = 'Invalid or expired access token. Please log in or request a new one';

      try {
        const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get('ACCESS_TOKEN_SECRET'),
        });

        if (!(await this.usersService.getOneBasic({ id: payload.id })))
          throw new UnauthorizedException(message);

        req.user = payload;
      } catch {
        throw new UnauthorizedException(message);
      }
    }
    return true;
  }
}
