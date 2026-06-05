import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user';
import { CreateBookingRequestDto } from './dto/booking.dto';
import { BookingEntity } from './entities/booking.entity';
import { BookingsService } from './bookings.service';

@ApiTags('bookings')
@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  createBooking(
    @Body() request: CreateBookingRequestDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<BookingEntity> {
    const userId = user?.sub ? Number(user.sub) : 1;
    return this.bookingsService.createBooking(request, userId);
  }

  @Get('marker/:markerId')
  getBookingsByMarker(
    @Param('markerId', ParseIntPipe) markerId: number,
  ): Promise<BookingEntity[]> {
    return this.bookingsService.getActiveBookingsByMarkerId(markerId);
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
}
