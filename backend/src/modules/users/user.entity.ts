import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { DEFAULT_USER_AVATAR } from '../../common/constants';
import { Project } from '../projects/project.entity';
import { Template } from '../templates/template.entity';
import { UserSocialAccount } from '../social-accounts/social-account.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true, length: 100 })
  readonly email!: string;

  @Column({ type: 'varchar', unique: true, length: 25 })
  username!: string;

  @Column({ type: 'varchar', default: DEFAULT_USER_AVATAR, length: 150 })
  avatar!: string;

  @Column({ type: 'varchar', nullable: true, length: 150 })
  about!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  readonly registerDate!: Date;

  @Column({ type: 'varchar', nullable: true, length: 60, select: false })
  password!: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true, select: false })
  googleId!: string | null;

  @Column({ type: 'varchar', nullable: true, length: 300, select: false })
  emailToken!: string | null;

  @Column({ type: 'varchar', nullable: true, length: 300, select: false })
  passwordToken!: string | null;

  @Column({ type: 'varchar', nullable: true, length: 300, select: false })
  refreshToken!: string | null;

  @Column({ type: 'varchar', nullable: true, length: 300, select: false })
  deletionToken!: string | null;

  @Column({ type: 'boolean', default: false })
  isAdmin!: boolean;

  @OneToMany(() => Project, (project) => project.author)
  projects!: Project[];

  @OneToMany(() => Template, (template) => template.author)
  templates!: Template[];

  @OneToMany(() => UserSocialAccount, (socialAccount) => socialAccount.user)
  socialAccounts!: UserSocialAccount[];
}
