import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const res: Response = host.switchToHttp().getResponse();
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong';
    let errors = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      message = exception.message;
      if (statusCode === HttpStatus.BAD_REQUEST || statusCode === HttpStatus.CONFLICT) {
        ({ errors } = exception.getResponse() as { errors: object });
      }
    }
    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) console.error(exception);

    res.status(statusCode).json({ statusCode, message, ...(errors && { errors }) });
  }
}
