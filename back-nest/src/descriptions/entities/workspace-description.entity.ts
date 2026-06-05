import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { DescriptionEntity } from './description.entity';

@Entity('workspace_desc')
export class WorkspaceDescriptionEntity {
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  @OneToOne(() => DescriptionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  description: DescriptionEntity;

  @Column({ name: 'have_computer', type: 'boolean', nullable: true })
  haveComputer?: boolean;
}
