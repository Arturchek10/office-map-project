import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuthUser } from '../auth/types/auth-user';
import { CursorResponse } from '../common/dto/cursor-response.dto';
import { MarkerEntity, MarkerType } from '../markers/entities/marker.entity';
import { toMarkerDto } from '../markers/markers.mapper';
import { LocalFileStorageService } from '../storage/storage.service';
import {
  AvailableMarkersDto,
  BookingDto,
  BusyIntervalDto,
  CreateBookingRequestDto,
  CreateBulkBookingRequestDto,
} from './dto/booking.dto';
import { BookingEntity, BookingStatus } from './entities/booking.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(MarkerEntity)
    private readonly markerRepository: Repository<MarkerEntity>,
    private readonly storage: LocalFileStorageService,
  ) {}

  async createBooking(
    request: CreateBookingRequestDto,
    userId: number,
  ): Promise<BookingDto> {
    const startTime = this.parseDate(request.startTime);
    const endTime = this.parseDate(request.endTime);
    this.validateBookingTime(request.markerId, startTime, endTime);

    const marker = await this.markerRepository.findOne({
      where: { id: request.markerId },
      relations: { layer: { floor: { office: true } } },
    });
    if (!marker) {
      throw new NotFoundException(
        `Marker with id=${request.markerId} not found`,
      );
    }
    if (
      ![MarkerType.WORKSPACE, MarkerType.ROOM].includes(
        marker.type as MarkerType,
      )
    ) {
      throw new BadRequestException(
        'Only workspace and room markers can be booked',
      );
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

    const price = this.calculatePrice(marker, startTime, endTime);
    const saved = await this.bookingRepository.save(
      this.bookingRepository.create({
        markerId: request.markerId,
        userId,
        startTime,
        endTime,
        pricePerHour: price.pricePerHour,
        totalPrice: price.totalPrice,
        status: BookingStatus.ACTIVE,
      }),
    );

    return this.getBookingById(saved.id);
  }

  async createBulkBooking(
    request: CreateBulkBookingRequestDto,
    userId: number,
  ): Promise<BookingDto[]> {
    const startTime = this.parseDate(request.startTime);
    const endTime = this.parseDate(request.endTime);
    const markerIds = [...new Set(request.markerIds)];

    if (markerIds.length === 0) {
      throw new BadRequestException('At least one marker is required');
    }

    this.validateBookingTime(markerIds[0], startTime, endTime);

    const markers = await this.markerRepository.find({
      where: { id: In(markerIds) },
      relations: { layer: { floor: { office: true } } },
    });
    if (markers.length !== markerIds.length) {
      throw new NotFoundException('One or more markers were not found');
    }

    const floorIds = new Set(markers.map((marker) => marker.layer?.floorId));
    if (floorIds.size !== 1) {
      throw new BadRequestException(
        'Bulk booking is allowed only within one floor',
      );
    }

    markers.forEach((marker) => this.validateMarkerBookable(marker));

    const busyMarkerIds = await this.findBusyMarkerIds(
      markerIds,
      startTime,
      endTime,
    );
    if (busyMarkerIds.length > 0) {
      throw new ConflictException(
        `Some places are already booked: ${busyMarkerIds.join(', ')}`,
      );
    }

    const markerById = new Map(markers.map((marker) => [marker.id, marker]));
    const saved = await this.bookingRepository.save(
      markerIds.map((markerId) => {
        const marker = markerById.get(markerId);
        if (!marker) {
          throw new NotFoundException(`Marker with id=${markerId} not found`);
        }

        const price = this.calculatePrice(marker, startTime, endTime);
        return this.bookingRepository.create({
          markerId,
          userId,
          startTime,
          endTime,
          pricePerHour: price.pricePerHour,
          totalPrice: price.totalPrice,
          status: BookingStatus.ACTIVE,
        });
      }),
    );

    return Promise.all(saved.map((booking) => this.getBookingById(booking.id)));
  }

  async getUserBookings(
    userId: number,
    activeOnly: boolean,
  ): Promise<BookingDto[]> {
    const query = this.bookingQuery()
      .withDeleted()
      .where('booking.user_id = :userId', { userId })
      .orderBy('booking.start_time', 'DESC');

    if (activeOnly) {
      query.andWhere('booking.status = :status', {
        status: BookingStatus.ACTIVE,
      });
      query.andWhere('booking.end_time >= :now', { now: new Date() });
    }

    const bookings = await query.getMany();
    return bookings.flatMap((booking) => this.toBookingListItemDto(booking));
  }

  async getUserBookingsPage(
    userId: number,
    activeOnly: boolean,
    cursor: string | undefined,
    size: number,
  ): Promise<CursorResponse<BookingDto>> {
    const safeSize = this.safeSize(size);
    const query = this.bookingQuery()
      .withDeleted()
      .where('booking.user_id = :userId', { userId })
      .andWhere('booking.id < :cursor', {
        cursor: this.parseCursor(cursor),
      })
      .orderBy('booking.id', 'DESC')
      .take(safeSize + 1);

    if (activeOnly) {
      query.andWhere('booking.status = :status', {
        status: BookingStatus.ACTIVE,
      });
      query.andWhere('booking.end_time >= :now', { now: new Date() });
    }

    const rows = await query.getMany();
    const dtos = rows.flatMap((booking) => this.toBookingListItemDto(booking));
    const visibleItems = dtos.slice(0, safeSize);

    return {
      items: visibleItems,
      nextCursor:
        dtos.length > safeSize ? visibleItems.at(-1)?.id ?? null : null,
      hasMore: dtos.length > safeSize,
    };
  }

  async getBooking(bookingId: number, user: AuthUser): Promise<BookingDto> {
    const booking = await this.bookingQuery()
      .withDeleted()
      .where('booking.id = :bookingId', { bookingId })
      .getOne();

    if (!booking) {
      throw new NotFoundException(`Booking with id=${bookingId} not found`);
    }

    const isOwner = booking.userId === Number(user.sub);
    const isAdmin = user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Booking belongs to another user');
    }

    return this.toBookingDto(booking);
  }

  async getBusyIntervalsByMarkerDay(
    markerId: number,
    dateRaw: string,
  ): Promise<BusyIntervalDto[]> {
    const dayStart = this.parseDayStart(dateRaw);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.marker_id = :markerId', { markerId })
      .andWhere('booking.status = :status', { status: BookingStatus.ACTIVE })
      .andWhere('booking.start_time < :dayEnd', { dayEnd })
      .andWhere('booking.end_time > :dayStart', { dayStart })
      .orderBy('booking.start_time', 'ASC')
      .getMany();

    return bookings.map((booking) => ({
      id: booking.id,
      startTime: booking.startTime,
      endTime: booking.endTime,
    }));
  }

  getActiveBookingsByMarkerId(markerId: number): Promise<BookingEntity[]> {
    return this.bookingRepository.find({
      where: { markerId, status: BookingStatus.ACTIVE },
      order: { startTime: 'ASC' },
    });
  }

  async getAvailableMarkersByFloor(
    floorId: number,
    startTimeRaw: string,
    endTimeRaw: string,
  ): Promise<AvailableMarkersDto> {
    const startTime = this.parseDate(startTimeRaw);
    const endTime = this.parseDate(endTimeRaw);
    this.validateTimeRange(startTime, endTime);

    const markers = await this.markerRepository
      .createQueryBuilder('marker')
      .leftJoin('marker.layer', 'layer')
      .leftJoinAndSelect('marker.photos', 'photo')
      .where('layer.floor_id = :floorId', { floorId })
      .andWhere('marker.type IN (:...types)', {
        types: [MarkerType.WORKSPACE, MarkerType.ROOM],
      })
      .orderBy('marker.id', 'ASC')
      .getMany();

    const busyMarkerIds = await this.findBusyMarkerIds(
      markers.map((marker) => marker.id),
      startTime,
      endTime,
    );
    const busy = new Set(busyMarkerIds);

    return {
      floorId,
      startTime,
      endTime,
      markers: markers
        .filter((marker) => !busy.has(marker.id))
        .map((marker) => toMarkerDto(marker, this.storage)),
    };
  }

  getOfficeBookings(officeId: number): Promise<BookingDto[]> {
    return this.bookingQuery()
      .where('office.id = :officeId', { officeId })
      .orderBy('booking.start_time', 'DESC')
      .getMany()
      .then((bookings) =>
        bookings.flatMap((booking) => this.toBookingListItemDto(booking)),
      );
  }

  async getActiveBookingsByFloorId(
    floorId: number,
    startTimeRaw: string,
    endTimeRaw: string,
  ): Promise<BookingEntity[]> {
    const startTime = this.parseDate(startTimeRaw);
    const endTime = this.parseDate(endTimeRaw);

    if (!Number.isFinite(floorId)) {
      throw new BadRequestException('Floor is required');
    }
    if (!startTime || !endTime || startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    const markers = await this.markerRepository
      .createQueryBuilder('marker')
      .leftJoin('marker.layer', 'layer')
      .where('layer.floor_id = :floorId', { floorId })
      .getMany();

    const markerIds = markers.map((marker) => marker.id);
    if (markerIds.length === 0) return [];

    return this.bookingRepository
      .find({
        where: {
          markerId: In(markerIds),
          status: BookingStatus.ACTIVE,
        },
        order: { startTime: 'ASC' },
        withDeleted: true,
      })
      .then((bookings) =>
        bookings.filter(
          (booking) =>
            booking.startTime < endTime && booking.endTime > startTime,
        ),
      );
  }

  private validateBookingTime(
    markerId: number,
    startTime: Date,
    endTime: Date,
  ) {
    if (!Number.isFinite(markerId)) {
      throw new BadRequestException('Marker is required');
    }

    this.validateTimeRange(startTime, endTime);
  }

  private validateTimeRange(startTime: Date, endTime: Date): void {
    if (
      !startTime ||
      !endTime ||
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime())
    ) {
      throw new BadRequestException('Booking time is required');
    }

    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    const now = new Date();
    now.setMinutes(now.getMinutes() - 1);
    if (startTime < now) {
      throw new BadRequestException('Booking cannot start in the past');
    }

    const durationMs = endTime.getTime() - startTime.getTime();
    if (durationMs > 24 * 60 * 60 * 1000) {
      throw new BadRequestException('Booking duration cannot exceed 24 hours');
    }
  }

  private validateMarkerBookable(marker: MarkerEntity): void {
    if (
      ![MarkerType.WORKSPACE, MarkerType.ROOM].includes(
        marker.type as MarkerType,
      )
    ) {
      throw new BadRequestException(
        `Marker with id=${marker.id} cannot be booked`,
      );
    }
  }

  private calculatePrice(
    marker: MarkerEntity,
    startTime: Date,
    endTime: Date,
  ): { pricePerHour: number; totalPrice: number } {
    const pricePerHour = Number(marker.pricePerHour ?? 0);
    const hours = (endTime.getTime() - startTime.getTime()) / (60 * 60 * 1000);

    return {
      pricePerHour,
      totalPrice: Number((pricePerHour * hours).toFixed(2)),
    };
  }

  private async findBusyMarkerIds(
    markerIds: number[],
    startTime: Date,
    endTime: Date,
  ): Promise<number[]> {
    if (markerIds.length === 0) return [];

    const rows = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('booking.marker_id', 'markerId')
      .where('booking.marker_id IN (:...markerIds)', { markerIds })
      .andWhere('booking.status = :status', { status: BookingStatus.ACTIVE })
      .andWhere('booking.start_time < :endTime', { endTime })
      .andWhere('booking.end_time > :startTime', { startTime })
      .groupBy('booking.marker_id')
      .getRawMany<{ markerId: string }>();

    return rows.map((row) => Number(row.markerId));
  }

  private async getBookingById(bookingId: number): Promise<BookingDto> {
    const booking = await this.bookingQuery()
      .withDeleted()
      .where('booking.id = :bookingId', { bookingId })
      .getOne();

    if (!booking) {
      throw new NotFoundException(`Booking with id=${bookingId} not found`);
    }
    return this.toBookingDto(booking);
  }

  private parseDate(value: string): Date {
    return new Date(value);
  }

  private parseCursor(cursor?: string): number {
    const parsed = Number(cursor ?? Number.MAX_SAFE_INTEGER);
    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : Number.MAX_SAFE_INTEGER;
  }

  private safeSize(size: number): number {
    return Math.max(1, Math.min(Number.isFinite(size) ? size : 20, 100));
  }

  private parseDayStart(value: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) {
      throw new BadRequestException('Date must have YYYY-MM-DD format');
    }

    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date is invalid');
    }
    return date;
  }

  private bookingQuery() {
    return this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.marker', 'marker')
      .leftJoinAndSelect('marker.layer', 'layer')
      .leftJoinAndSelect('layer.floor', 'floor')
      .leftJoinAndSelect('floor.office', 'office');
  }

  private toBookingDto(booking: BookingEntity): BookingDto {
    const marker = booking.marker;
    const floor = marker?.layer?.floor;
    const office = floor?.office;

    if (!marker || !floor || !office) {
      throw new NotFoundException('Booking place is not available');
    }

    return {
      id: booking.id,
      markerId: booking.markerId,
      userId: booking.userId,
      startTime: booking.startTime,
      endTime: booking.endTime,
      pricePerHour: Number(booking.pricePerHour ?? marker.pricePerHour ?? 0),
      totalPrice: Number(
        booking.totalPrice ??
          this.calculatePrice(marker, booking.startTime, booking.endTime)
            .totalPrice,
      ),
      status: booking.status,
      place: {
        officeId: office.id,
        officeName: office.name ?? null,
        officeAddress: office.address ?? null,
        floorId: floor.id,
        floorName: floor.name,
        floorOrderNumber: floor.orderNumber,
        floorPhotoUrl: this.storage.presignGet(floor.photoKey),
        marker: {
          id: marker.id,
          name: marker.name ?? null,
          type: marker.type ?? null,
          pricePerHour: Number(marker.pricePerHour ?? 0),
          position:
            marker.positionX != null && marker.positionY != null
              ? {
                  position_x: marker.positionX,
                  position_y: marker.positionY,
                }
              : null,
        },
      },
    };
  }

  private toBookingListItemDto(booking: BookingEntity): BookingDto[] {
    try {
      return [this.toBookingDto(booking)];
    } catch (error) {
      if (error instanceof NotFoundException) {
        return [];
      }
      throw error;
    }
  }
}
