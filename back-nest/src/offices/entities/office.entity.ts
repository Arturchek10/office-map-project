import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
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
  photoKey?: string;

  @OneToMany(() => FloorEntity, (floor) => floor.office, {
    cascade: true,
  })
  floors: FloorEntity[];
}
