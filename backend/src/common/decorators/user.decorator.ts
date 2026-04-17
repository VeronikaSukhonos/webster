import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../types';

export const User = createParamDecorator((field: string, ctx: ExecutionContext) => {
  const req: Request = ctx.switchToHttp().getRequest();
  const user = req.user;

  return field ? user?.[field as keyof JwtPayload] : user;
});
