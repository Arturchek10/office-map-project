import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FloorEntity } from '../../floors/entities/floor.entity';

@Entity('furniture')
export class FurnitureEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'photo_key', length: 1024 })
  photoKey: string;

  @Column({ type: 'int', default: 0 })
  angle: number;

  @Column({ name: 'position_x', type: 'double precision', nullable: true })
  positionX?: number;

  @Column({ name: 'position_y', type: 'double precision', nullable: true })
  positionY?: number;

  @Column({ name: 'size_factor', type: 'double precision', default: 1 })
  sizeFactor: number;

  @Column({ name: 'floor_id', type: 'bigint', nullable: true })
  floorId?: number;

  @ManyToOne(() => FloorEntity, (floor) => floor.furnitures, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'floor_id' })
  floor?: FloorEntity;
}
