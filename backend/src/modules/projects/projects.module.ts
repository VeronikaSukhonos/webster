import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Template } from '../templates/template.entity';
import { CloudflareR2Module } from '../cloudflare-r2/cloudflare-r2.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Template]), CloudflareR2Module],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
