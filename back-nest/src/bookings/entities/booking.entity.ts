import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import { MarkerEntity } from '../../markers/entities/marker.entity';

export enum BookingStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity('bookings')
export class BookingEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'marker_id', type: 'bigint' })
  markerId: number;

  @ManyToOne(() => MarkerEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'marker_id' })
  marker: MarkerEntity;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime: Date;

  @Column({ name: 'price_per_hour', type: 'double precision', default: 0 })
  pricePerHour: number;

  @Column({ name: 'total_price', type: 'double precision', default: 0 })
  totalPrice: number;

  @Column({ length: 30 })
  status: BookingStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
