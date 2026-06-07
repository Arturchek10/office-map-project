import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoleEntity } from './role.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, select: false })
  password: string;

  @Column({ name: 'role_id', type: 'bigint' })
  roleId: number;

  @Column({ name: 'banned_at', type: 'timestamp', nullable: true })
  bannedAt?: Date | null;

  @Column({ name: 'banned_reason', type: 'varchar', length: 500, nullable: true })
  bannedReason?: string | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date | null;

  @ManyToOne(() => RoleEntity, (role) => role.users, {
    eager: true,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;
}
