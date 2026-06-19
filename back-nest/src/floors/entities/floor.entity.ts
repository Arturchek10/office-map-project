import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FurnitureEntity } from '../../furniture/entities/furniture.entity';
import { LayerEntity } from '../../layers/entities/layer.entity';
import { OfficeEntity } from '../../offices/entities/office.entity';

@Entity('floors')
export class FloorEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'order_number', type: 'int' })
  orderNumber: number;

  @Column({ name: 'photo_key', type: 'varchar', nullable: true, length: 1024 })
  photoKey?: string;

  @Column({ name: 'office_id', type: 'bigint' })
  officeId: number;

  @ManyToOne(() => OfficeEntity, (office) => office.floors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'office_id' })
  office: OfficeEntity;

  @OneToMany(() => LayerEntity, (layer) => layer.floor, {
    cascade: true,
  })
  layers: LayerEntity[];

  @OneToMany(() => FurnitureEntity, (furniture) => furniture.floor)
  furnitures: FurnitureEntity[];
}
