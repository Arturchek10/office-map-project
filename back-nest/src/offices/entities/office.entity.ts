import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import { FloorEntity } from '../../floors/entities/floor.entity';

@Entity('office')
export class OfficeEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  name?: string;

  @Column({ type: 'varchar', nullable: true, unique: true, length: 255 })
  address?: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  city?: string;

  @Column({ type: 'double precision', nullable: true })
  latitude?: number;

  @Column({ type: 'double precision', nullable: true })
  longitude?: number;

  @Column({ name: 'photo_key', type: 'varchar', nullable: true, length: 1024 })
  photoKey?: string | null;

  @Column({ name: 'created_by_user_id', type: 'bigint', nullable: true })
  createdByUserId?: number;

  @ManyToOne(() => UserEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser?: UserEntity;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date | null;

  @OneToMany(() => FloorEntity, (floor) => floor.office, {
    cascade: true,
  })
  floors: FloorEntity[];
}
