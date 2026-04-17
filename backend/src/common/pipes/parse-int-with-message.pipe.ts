import { BadRequestException, HttpStatus, NotFoundException, ParseIntPipe } from '@nestjs/common';

export class ParseIntWithMessagePipe extends ParseIntPipe {
  constructor(message: string, error: HttpStatus = HttpStatus.BAD_REQUEST, optional?: boolean) {
    super({
      ...(optional && { optional }),
      exceptionFactory: () => {
        if (error === HttpStatus.NOT_FOUND) throw new NotFoundException(message ?? 'Not found');
        else throw new BadRequestException(message ?? 'Validation failed');
      },
    });
  }
}
