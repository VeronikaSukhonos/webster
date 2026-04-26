import {
  BadRequestException,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';

export class FileValidationPipe extends ParseFilePipe {
  constructor(fileIsRequired: boolean = true) {
    super({
      fileIsRequired,
      validators: [
        new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
        new FileTypeValidator({ fileType: /^image\/(png|jpeg)$/ }),
      ],
      exceptionFactory: (e) => {
        if (e.includes('file type'))
          throw new BadRequestException(
            'Invalid file format - only JPG (JPEG) and PNG are allowed',
          );
        else if (e.includes('file size'))
          throw new BadRequestException('Invalid file size - max 5MB');
        else throw new BadRequestException(e);
      },
    });
  }
}
