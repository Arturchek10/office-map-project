import { Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { DescriptionEntity } from './description.entity';

@Entity('emergency_desc')
export class EmergencyDescriptionEntity {
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  @OneToOne(() => DescriptionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  description: DescriptionEntity;
}
