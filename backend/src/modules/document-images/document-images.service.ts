import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { DocumentImage } from './document-image.entity';
import { CloudflareR2Service } from '../cloudflare-r2/cloudflare-r2.service';
import { uploadFileToPath } from '../../common/utils';

interface ImageResponse {
  id: string;
  url: string;
}

interface ImageOwner {
  projectId?: number | null;
  templateId?: number | null;
}

@Injectable()
export class DocumentImagesService {
  constructor(
    @InjectRepository(DocumentImage)
    private readonly documentImagesRepository: Repository<DocumentImage>,
    private readonly configService: ConfigService,
    private readonly cloudflareR2Service: CloudflareR2Service,
  ) {}

  async getProjectImages(projectId: number): Promise<ImageResponse[]> {
    return this.toResponse(
      await this.documentImagesRepository.find({
        where: { projectId, deletedAt: IsNull() },
        order: { id: 'ASC' },
      }),
    );
  }

  async getTemplateImages(templateId: number): Promise<ImageResponse[]> {
    return this.toResponse(
      await this.documentImagesRepository.find({
        where: { templateId, deletedAt: IsNull() },
        order: { id: 'ASC' },
      }),
    );
  }

  async syncProjectImages(
    projectId: number,
    uploads: Express.Multer.File[] = [],
    uploadIds?: string[],
    imageIds?: string[],
  ): Promise<ImageResponse[]> {
    await this.syncImages({ projectId, templateId: null }, uploads, uploadIds, imageIds);
    return await this.getProjectImages(projectId);
  }

  async copyProjectImagesToProject(
    sourceProjectId: number,
    targetProjectId: number,
  ): Promise<void> {
    await this.copyImages({ projectId: sourceProjectId }, { projectId: targetProjectId });
  }

  async copyProjectImagesToTemplate(
    sourceProjectId: number,
    targetTemplateId: number,
  ): Promise<void> {
    await this.copyImages({ projectId: sourceProjectId }, { templateId: targetTemplateId });
  }

  async copyTemplateImagesToProject(
    sourceTemplateId: number,
    targetProjectId: number,
  ): Promise<void> {
    await this.copyImages({ templateId: sourceTemplateId }, { projectId: targetProjectId });
  }

  private async syncImages(
    owner: Required<ImageOwner>,
    uploads: Express.Multer.File[],
    uploadIds?: string[],
    imageIds?: string[],
  ): Promise<void> {
    if (uploadIds === undefined && imageIds === undefined && uploads.length === 0) return;

    const normalizedUploadIds = uploadIds ?? [];

    if (uploads.length !== normalizedUploadIds.length) {
      throw new BadRequestException('uploads and uploadIds must have the same length');
    }

    this.assertUniqueIds(normalizedUploadIds, 'uploadIds');
    this.assertUniqueIds(imageIds ?? [], 'imageIds');

    const activeIds = new Set([...(imageIds ?? []), ...normalizedUploadIds]);
    const existingImages = await this.documentImagesRepository.find({
      where: this.createOwnerWhere(owner),
    });
    const existingByLocalId = new Map(existingImages.map((image) => [image.localId, image]));

    for (const [index, upload] of uploads.entries()) {
      const localId = normalizedUploadIds[index];
      const url = await this.uploadDocumentImage(upload);
      const existingImage = existingByLocalId.get(localId);

      if (existingImage) {
        existingImage.url = url;
        existingImage.deletedAt = null;
        await this.documentImagesRepository.save(existingImage);
      } else {
        await this.documentImagesRepository.save(
          this.documentImagesRepository.create({
            ...owner,
            localId,
            url,
            deletedAt: null,
          }),
        );
      }
    }

    for (const image of existingImages) {
      image.deletedAt = activeIds.has(image.localId) ? null : new Date();
    }

    if (existingImages.length) {
      await this.documentImagesRepository.save(existingImages);
    }
  }

  private async copyImages(source: ImageOwner, target: ImageOwner): Promise<void> {
    const sourceImages = await this.documentImagesRepository.find({
      where: { ...this.createOwnerWhere(source), deletedAt: IsNull() },
      order: { id: 'ASC' },
    });

    if (!sourceImages.length) return;

    await this.documentImagesRepository.save(
      sourceImages.map((image) =>
        this.documentImagesRepository.create({
          projectId: target.projectId ?? null,
          templateId: target.templateId ?? null,
          localId: image.localId,
          url: image.url,
          deletedAt: null,
        }),
      ),
    );
  }

  private async uploadDocumentImage(file: Express.Multer.File): Promise<string> {
    const filename = `image-${crypto.randomBytes(12).toString('hex')}`;

    return this.configService.get('EMAIL_API_AND_CLOUD_FILE_STORAGE') === 'true'
      ? await this.cloudflareR2Service.uploadImageFile(file, 'images', filename)
      : await uploadFileToPath(file, 'images', filename);
  }

  private assertUniqueIds(ids: string[], param: string): void {
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(`${param} must contain unique values`);
    }
  }

  private toResponse(images: DocumentImage[]): ImageResponse[] {
    return images.map((image) => ({ id: image.localId, url: image.url }));
  }

  private createOwnerWhere(owner: ImageOwner): FindOptionsWhere<DocumentImage> {
    if (owner.projectId !== undefined && owner.projectId !== null) {
      return { projectId: owner.projectId };
    }

    return { templateId: owner.templateId ?? undefined };
  }
}
