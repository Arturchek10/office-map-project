import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../auth/entities/role.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/types/auth-user';
import {
  AvailableMarkersDto,
  BookingDto,
  BusyIntervalDto,
  CreateBulkBookingRequestDto,
  CreateBookingRequestDto,
} from './dto/booking.dto';
import { BookingEntity } from './entities/booking.entity';
import { BookingsService } from './bookings.service';

@ApiTags('bookings')
@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  createBooking(
    @Body() request: CreateBookingRequestDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BookingDto> {
    return this.bookingsService.createBooking(request, Number(user.sub));
  }

  @Post('bulk')
  @Roles(RoleName.ADMIN, RoleName.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  createBulkBooking(
    @Body() request: CreateBulkBookingRequestDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BookingDto[]> {
    return this.bookingsService.createBulkBooking(request, Number(user.sub));
  }

  @Get('my')
  @Roles(RoleName.ADMIN, RoleName.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  getMyBookings(
    @CurrentUser() user: AuthUser,
    @Query('activeOnly', new ParseBoolPipe({ optional: true }))
    activeOnly = false,
  ): Promise<BookingDto[]> {
    return this.bookingsService.getUserBookings(Number(user.sub), activeOnly);
  }

  @Get('marker/:markerId/day')
  getMarkerBookingsByDay(
    @Param('markerId', ParseIntPipe) markerId: number,
    @Query('date') date: string,
  ): Promise<BusyIntervalDto[]> {
    return this.bookingsService.getBusyIntervalsByMarkerDay(markerId, date);
  }

  @Get('marker/:markerId')
  getBookingsByMarker(
    @Param('markerId', ParseIntPipe) markerId: number,
  ): Promise<BookingEntity[]> {
    return this.bookingsService.getActiveBookingsByMarkerId(markerId);
  }

  @Get('floor/:floorId/available')
  getAvailableMarkersByFloor(
    @Param('floorId', ParseIntPipe) floorId: number,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ): Promise<AvailableMarkersDto> {
    return this.bookingsService.getAvailableMarkersByFloor(
      floorId,
      startTime,
      endTime,
    );
  }

  @Get('floor/:floorId')
  getBookingsByFloor(
    @Param('floorId', ParseIntPipe) floorId: number,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ): Promise<BookingEntity[]> {
    return this.bookingsService.getActiveBookingsByFloorId(
      floorId,
      startTime,
      endTime,
    );
  }

  @Get(':bookingId')
  @Roles(RoleName.ADMIN, RoleName.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  getBooking(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @CurrentUser() user: AuthUser,
  ): Promise<BookingDto> {
    return this.bookingsService.getBooking(bookingId, user);
  }
}
