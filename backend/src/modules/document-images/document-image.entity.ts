import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { Template } from '../templates/template.entity';

@Index(['projectId', 'localId'], { unique: true })
@Index(['templateId', 'localId'], { unique: true })
@Check(
  'CHK_document_images_single_owner',
  '("projectId" IS NOT NULL AND "templateId" IS NULL) OR ("projectId" IS NULL AND "templateId" IS NOT NULL)',
)
@Entity({ name: 'document_images' })
export class DocumentImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  localId!: string;

  @Column({ type: 'integer', nullable: true })
  projectId!: number | null;

  @ManyToOne(() => Project, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: Project | null;

  @Column({ type: 'integer', nullable: true })
  templateId!: number | null;

  @ManyToOne(() => Template, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'templateId' })
  template!: Template | null;

  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;
}
