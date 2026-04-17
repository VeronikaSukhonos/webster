import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const time = new Date().toString().split(' (')[0];

    res.on('finish', () => {
      console.log(`[${time}] ${req.method} ${req.originalUrl} - ${res.statusCode}`);
    });
    next();
  }
}
