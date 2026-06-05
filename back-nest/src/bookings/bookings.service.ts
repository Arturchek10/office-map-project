import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MarkerEntity } from '../markers/entities/marker.entity';
import { CreateBookingRequestDto } from './dto/booking.dto';
import { BookingEntity, BookingStatus } from './entities/booking.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(MarkerEntity)
    private readonly markerRepository: Repository<MarkerEntity>,
  ) {}

  async createBooking(
    request: CreateBookingRequestDto,
    userId: number,
  ): Promise<BookingEntity> {
    const startTime = this.parseDate(request.startTime);
    const endTime = this.parseDate(request.endTime);
    this.validateBookingTime(request.markerId, startTime, endTime);

    const markerExists = await this.markerRepository.exists({
      where: { id: request.markerId },
    });
    if (!markerExists) {
      throw new NotFoundException(`Marker with id=${request.markerId} not found`);
    }

    const hasConflict = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.marker_id = :markerId', { markerId: request.markerId })
      .andWhere('booking.status = :status', { status: BookingStatus.ACTIVE })
      .andWhere('booking.start_time < :newEndTime', { newEndTime: endTime })
      .andWhere('booking.end_time > :newStartTime', { newStartTime: startTime })
      .getExists();

    if (hasConflict) {
      throw new ConflictException('Place is already booked for selected time');
    }

    return this.bookingRepository.save(
      this.bookingRepository.create({
        markerId: request.markerId,
        userId,
        startTime,
        endTime,
        status: BookingStatus.ACTIVE,
      }),
    );
  }

  getActiveBookingsByMarkerId(markerId: number): Promise<BookingEntity[]> {
    return this.bookingRepository.find({
      where: { markerId, status: BookingStatus.ACTIVE },
      order: { startTime: 'ASC' },
    });
  }

  async getActiveBookingsByFloorId(
    floorId: number,
    startTimeRaw: string,
    endTimeRaw: string,
  ): Promise<BookingEntity[]> {
    const startTime = this.parseDate(startTimeRaw);
    const endTime = this.parseDate(endTimeRaw);

    if (!Number.isFinite(floorId)) {
      throw new Error('Floor is required');
    }
    if (!startTime || !endTime || startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }

    const markers = await this.markerRepository
      .createQueryBuilder('marker')
      .leftJoin('marker.layer', 'layer')
      .where('layer.floor_id = :floorId', { floorId })
      .getMany();

    const markerIds = markers.map((marker) => marker.id);
    if (markerIds.length === 0) return [];

    return this.bookingRepository.find({
      where: {
        markerId: In(markerIds),
        status: BookingStatus.ACTIVE,
      },
      order: { startTime: 'ASC' },
    }).then((bookings) =>
      bookings.filter(
        (booking) => booking.startTime < endTime && booking.endTime > startTime,
      ),
    );
  }

  private validateBookingTime(markerId: number, startTime: Date, endTime: Date) {
    if (!Number.isFinite(markerId)) {
      throw new Error('Marker is required');
    }

    if (!startTime || !endTime || Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new Error('Booking time is required');
    }

    if (startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }
  }

  private parseDate(value: string): Date {
    return new Date(value);
  }
}
