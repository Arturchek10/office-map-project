import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { DescriptionEntity } from './description.entity';

@Entity('room_desc')
export class RoomDescriptionEntity {
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  @OneToOne(() => DescriptionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  description: DescriptionEntity;

  @Column({ type: 'int', nullable: true })
  capacity?: number;
}
