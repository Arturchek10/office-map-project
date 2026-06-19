import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class OfficeCreateRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  address: string;

  @ApiProperty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  city: string;
}

export class OfficeUpdateRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 255)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  removePhoto?: boolean;
}

export type OfficeDto = {
  id: number;
  name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  createdByUserId: number | null;
  photoUrl: string | null;
  floorsCount: number;
};

export type FloorShortDto = {
  id: number;
  name: string;
  orderNumber: number;
};

export type OfficeShortDto = {
  id: number;
  name: string | null;
  createdByUserId: number | null;
  startFloor: FloorShortDto | null;
  floors: FloorShortDto[];
};
