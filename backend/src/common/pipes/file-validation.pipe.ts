import {
  BadRequestException,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';

interface FileValidationPipeOptions {
  fileIsRequired?: boolean;
  maxSize?: number;
  fileType?: RegExp;
  invalidFormatMessage?: string;
}

export class FileValidationPipe extends ParseFilePipe {
  constructor(options: boolean | FileValidationPipeOptions = true) {
    const normalizedOptions = typeof options === 'boolean' ? { fileIsRequired: options } : options;
    const {
      fileIsRequired = true,
      maxSize = 1024 * 1024 * 5,
      fileType = /^image\/(png|jpeg)$/,
      invalidFormatMessage = 'Invalid file format - only JPG (JPEG) and PNG are allowed',
    } = normalizedOptions;

    super({
      fileIsRequired,
      validators: [new MaxFileSizeValidator({ maxSize }), new FileTypeValidator({ fileType })],
      exceptionFactory: (e) => {
        if (e.includes('file type')) throw new BadRequestException(invalidFormatMessage);
        else if (e.includes('file size'))
          throw new BadRequestException('Invalid file size - max 5MB');
        else throw new BadRequestException(e);
      },
    });
  }
}
