import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../../common/types';

@Injectable()
export class TokenService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async createToken(payload: JwtPayload, type: 'ACCESS' | 'REFRESH' | 'CONFIRM'): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get(`${type}_TOKEN_SECRET`),
      expiresIn: this.configService.get(`${type}_TOKEN_TTL`),
    });
  }

  async verifyToken(token: string, type: 'ACCESS' | 'REFRESH' | 'CONFIRM'): Promise<JwtPayload> {
    return await this.jwtService.verifyAsync(token, {
      secret: this.configService.get(`${type}_TOKEN_SECRET`),
    });
  }
}
