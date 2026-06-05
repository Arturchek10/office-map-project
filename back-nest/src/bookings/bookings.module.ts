import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarkerEntity } from '../markers/entities/marker.entity';
import { BookingEntity } from './entities/booking.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [TypeOrmModule.forFeature([BookingEntity, MarkerEntity])],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
