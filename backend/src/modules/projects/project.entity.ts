import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Template } from '../templates/template.entity';

@Entity({ name: 'projects' })
export class Project {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  authorId!: number;

  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @Column({ type: 'varchar', length: 100 })
  title!: string;

  @Column({ type: 'varchar', nullable: true, length: 300 })
  description!: string | null;

  @Column({ type: 'varchar', length: 150 })
  file!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  preview!: string;

  @Column({ type: 'integer', default: 1080 })
  width!: number;

  @Column({ type: 'integer', default: 1080 })
  height!: number;

  @Column({ type: 'boolean', default: false })
  isPublic!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createDate!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  editDate!: Date;

  @Column({ type: 'integer', nullable: true })
  templateId!: number | null;

  @ManyToOne(() => Template, (template) => template.projects, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'templateId' })
  template!: Template | null;

  @OneToMany(() => Template, (template) => template.project)
  createdTemplates!: Template[];
}
