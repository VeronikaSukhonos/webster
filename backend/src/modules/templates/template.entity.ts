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

  @Column({ type: 'varchar', length: 500 })
  file!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createDate!: Date;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @OneToMany(() => Project, (project) => project.template)
  projects!: Project[];
}
