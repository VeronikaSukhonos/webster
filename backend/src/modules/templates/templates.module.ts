import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from './template.entity';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { Project } from '../projects/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Template, Project])],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
