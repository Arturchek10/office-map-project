import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Point, PointDto } from '../../common/dto/point.dto';

export class FurnitureCreateRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;
}

export class FurniturePlaceRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: PointDto })
  @ValidateNested()
  @Type(() => PointDto)
  position: Point;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  photoUrl: string;
}

export class FurnitureMoveRequestDto {
  @ApiProperty({ type: PointDto })
  @ValidateNested()
  @Type(() => PointDto)
  position: Point;
}

export class FurniturePatchUiRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(359)
  angle?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPositive()
  sizeFactor?: number;
}

export class FurniturePatchRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  removePhoto?: boolean;
}

export type FurnitureDto = {
  id: number;
  name: string;
  photoUrl: string | null;
  angle: number;
  position: Point | null;
  sizeFactor: number;
};

export type FurnitureShortDto = {
  id: number;
  name: string;
  photoUrl: string | null;
};
