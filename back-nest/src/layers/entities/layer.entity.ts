import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FloorEntity } from '../../floors/entities/floor.entity';
import { MarkerEntity } from '../../markers/entities/marker.entity';

@Entity('layers')
export class LayerEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'boolean' })
  base: boolean;

  @Column({ name: 'floor_id', type: 'bigint' })
  floorId: number;

  @ManyToOne(() => FloorEntity, (floor) => floor.layers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'floor_id' })
  floor: FloorEntity;

  @OneToMany(() => MarkerEntity, (marker) => marker.layer, {
    cascade: true,
  })
  markers: MarkerEntity[];
}
