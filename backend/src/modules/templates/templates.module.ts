import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from './template.entity';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { Project } from '../projects/project.entity';
import { CloudflareR2Module } from '../cloudflare-r2/cloudflare-r2.module';
import { DocumentImagesModule } from '../document-images/document-images.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Template, Project]),
    CloudflareR2Module,
    DocumentImagesModule,
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
