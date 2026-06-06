import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsDateString, IsInt, IsNotEmpty, IsNumber } from 'class-validator';
import { MarkerDto, MarkerTypeValue } from '../../markers/dto/marker.dto';

export class CreateBookingRequestDto {
  @ApiProperty()
  @IsNumber()
  markerId: number;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  endTime: string;
}

export class CreateBulkBookingRequestDto {
  @ApiProperty({ type: [Number] })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsInt({ each: true })
  markerIds: number[];

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  endTime: string;
}

export type BookingMarkerDto = {
  id: number;
  name: string | null;
  type: MarkerTypeValue | null;
  pricePerHour: number;
  position: {
    position_x: number;
    position_y: number;
  } | null;
};

export type BookingPlaceDto = {
  officeId: number;
  officeName: string | null;
  officeAddress: string | null;
  floorId: number;
  floorName: string;
  floorOrderNumber: number;
  floorPhotoUrl: string | null;
  marker: BookingMarkerDto;
};

export type BookingDto = {
  id: number;
  markerId: number;
  userId: number;
  startTime: Date;
  endTime: Date;
  pricePerHour: number;
  totalPrice: number;
  status: string;
  place: BookingPlaceDto;
};

export type BusyIntervalDto = {
  id: number;
  startTime: Date;
  endTime: Date;
};

export type AvailableMarkersDto = {
  floorId: number;
  startTime: Date;
  endTime: Date;
  markers: MarkerDto[];
};
