import { Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { DescriptionEntity } from './description.entity';

@Entity('utility_desc')
export class UtilityDescriptionEntity {
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  @OneToOne(() => DescriptionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  description: DescriptionEntity;
}
