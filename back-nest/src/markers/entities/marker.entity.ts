import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DescriptionEntity } from '../../descriptions/entities/description.entity';
import { LayerEntity } from '../../layers/entities/layer.entity';

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

  @Column({ name: 'description_id', type: 'bigint', nullable: true, unique: true })
  descriptionId?: number;

  @OneToOne(() => DescriptionEntity, {
    nullable: true,
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'description_id' })
  description?: DescriptionEntity;

  @Column({ name: 'is_uncomfortable', type: 'boolean', nullable: true })
  uncomfortable?: boolean;
}
