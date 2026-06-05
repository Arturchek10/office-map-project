import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('description')
export class DescriptionEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'text', nullable: true })
  text?: string;
}
