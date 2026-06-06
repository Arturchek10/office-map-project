import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LayerEntity } from '../../layers/entities/layer.entity';
import { MarkerPhotoEntity } from './marker-photo.entity';

export enum MarkerType {
  WORKSPACE = 'workspace',
  ROOM = 'room',
  UTILITY = 'utility',
  EMERGENCY = 'emergency',
}

@Entity('markers')
export class MarkerEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  name?: string;

  @Column({ type: 'varchar', nullable: true, length: 50 })
  type?: MarkerType;

  @Column({ name: 'layer_id', type: 'bigint', nullable: true })
  layerId?: number;

  @ManyToOne(() => LayerEntity, (layer) => layer.markers, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'layer_id' })
  layer?: LayerEntity;

  @Column({ name: 'position_x', type: 'double precision', nullable: true })
  positionX?: number;

  @Column({ name: 'position_y', type: 'double precision', nullable: true })
  positionY?: number;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown>;

  @Column({ name: 'price_per_hour', type: 'double precision', default: 0 })
  pricePerHour: number;

  @Column({ name: 'is_uncomfortable', type: 'boolean', nullable: true })
  uncomfortable?: boolean;

  @OneToMany(() => MarkerPhotoEntity, (photo) => photo.marker, {
    cascade: true,
  })
  photos: MarkerPhotoEntity[];
}
