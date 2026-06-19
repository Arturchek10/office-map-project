import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MarkerEntity } from './marker.entity';

@Entity('marker_photos')
export class MarkerPhotoEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'marker_id', type: 'bigint' })
  markerId: number;

  @ManyToOne(() => MarkerEntity, (marker) => marker.photos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'marker_id' })
  marker: MarkerEntity;

  @Column({ name: 'photo_key', type: 'varchar', length: 1024 })
  photoKey: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;
}
