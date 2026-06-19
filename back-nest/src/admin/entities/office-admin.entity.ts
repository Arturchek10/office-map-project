import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('office_admins')
@Unique(['officeId', 'login'])
export class OfficeAdminEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'office_id', type: 'bigint' })
  officeId: number;

  @Column({ length: 255 })
  login: string;

  @Column({ name: 'created_by', length: 255 })
  createdBy: string;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
