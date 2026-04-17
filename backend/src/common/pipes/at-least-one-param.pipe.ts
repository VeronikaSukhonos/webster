import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class AtLeastOneParamPipe implements PipeTransform {
  constructor(private readonly params: string[]) {}

  transform(value: object, metadata: ArgumentMetadata) {
    if (metadata.type === 'body') {
      for (const p of this.params) {
        if (value[p as keyof typeof value] !== undefined) return value;
      }

      throw new BadRequestException(
        `At least one parameter must be provided: ${this.params.join(', ')}`,
      );
    }
    return value;
  }
}
