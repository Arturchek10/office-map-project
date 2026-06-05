import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Point, PointDto } from '../../common/dto/point.dto';

export const markerTypes = ['workspace', 'room', 'utility', 'emergency'] as const;
export type MarkerTypeValue = (typeof markerTypes)[number];

export class CreateMarkerRequestDto {
  @ApiProperty({ enum: markerTypes })
  @IsString()
  @IsNotEmpty()
  @IsIn(markerTypes)
  type: MarkerTypeValue;

  @ApiPropertyOptional({ type: PointDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PointDto)
  position?: Point;
}

export class MarkerMoveRequestDto {
  @ApiProperty({ type: PointDto })
  @ValidateNested()
  @Type(() => PointDto)
  position: Point;
}

export class UpdateMarkerRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiProperty({ enum: markerTypes })
  @IsString()
  @IsNotEmpty()
  @IsIn(markerTypes)
  type: MarkerTypeValue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  uncomfortable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export type DescriptionPayloadDto =
  | { text?: string | null; capacity?: number | null }
  | { text?: string | null; haveComputer?: boolean | null }
  | { text?: string | null };

export type MarkerShortDto = {
  id: number;
  position: Point | null;
  type: MarkerTypeValue | null;
};

export type MarkerDto = {
  id: number;
  name: string | null;
  type: MarkerTypeValue | null;
  position: Point | null;
  uncomfortable: boolean;
  payload: DescriptionPayloadDto | null;
};
