import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentImage } from './document-image.entity';
import { DocumentImagesService } from './document-images.service';
import { CloudflareR2Module } from '../cloudflare-r2/cloudflare-r2.module';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentImage]), CloudflareR2Module],
  providers: [DocumentImagesService],
  exports: [DocumentImagesService],
})
export class DocumentImagesModule {}
