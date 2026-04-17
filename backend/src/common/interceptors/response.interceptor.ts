import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Response } from 'express';
import type { ApiResponse } from '../types';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const res: Response = ctx.switchToHttp().getResponse();
    const statusCode = res.statusCode;

    return next.handle().pipe(
      map((apiResponse) => {
        const ar =
          typeof apiResponse === 'object' && apiResponse !== null
            ? (apiResponse as ApiResponse)
            : { message: '' };

        return { statusCode, message: ar.message ?? '', ...(ar.data && { data: ar.data }) };
      }),
    );
  }
}
