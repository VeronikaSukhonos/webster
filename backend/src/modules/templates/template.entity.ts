import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { TemplateType } from './template-type.enum';

@Entity({ name: 'templates' })
export class Template {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  authorId!: number;

  @ManyToOne(() => User, (user) => user.templates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @Column({ type: 'varchar', length: 100 })
  title!: string;

  @Column({ type: 'varchar', length: 100 })
  file!: string;

  @Column({ type: 'varchar', length: 100, default: '' })
  preview!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createDate!: Date;

  @Column({ type: 'enum', enum: TemplateType, enumName: 'template_type_enum' })
  type!: TemplateType;

  @Column({ type: 'boolean', default: false })
  isBuiltIn!: boolean;

  @Column({ type: 'integer', nullable: true })
  projectId!: number | null;

  @ManyToOne(() => Project, (project) => project.createdTemplates, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'projectId' })
  project!: Project | null;

  @OneToMany(() => Project, (project) => project.template)
  projects!: Project[];
}
