import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { DEFAULT_USER_AVATAR } from '../../common/constants';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true, length: 100 })
  readonly email!: string;

  @Column({ type: 'varchar', unique: true, length: 25 })
  username!: string;

  @Column({ type: 'varchar', nullable: true, length: 200 })
  about!: string | null;

  @Column({ type: 'varchar', default: DEFAULT_USER_AVATAR, length: 100 })
  avatar!: string;

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
}
