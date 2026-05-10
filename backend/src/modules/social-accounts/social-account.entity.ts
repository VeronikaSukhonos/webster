import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum SocialProvider {
  Facebook = 'facebook',
  Instagram = 'instagram',
}

@Entity({ name: 'user_social_accounts' })
@Index(['provider', 'providerAccountId'], { unique: true })
@Index(['userId', 'provider'], { unique: true })
export class UserSocialAccount {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  userId!: number;

  @ManyToOne(() => User, (user) => user.socialAccounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'enum', enum: SocialProvider })
  provider!: SocialProvider;

  @Column({ type: 'varchar', length: 255 })
  providerAccountId!: string;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  username!: string | null;

  @Column({ type: 'varchar', nullable: true, length: 150 })
  displayName!: string | null;

  @Column({ type: 'text', nullable: true })
  avatar!: string | null;

  @Column({ type: 'text', nullable: true, select: false })
  accessToken!: string | null;

  @Column({ type: 'text', nullable: true, select: false })
  refreshToken!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  scopes!: string | null;
}
