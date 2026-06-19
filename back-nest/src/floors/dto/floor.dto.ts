import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { FurnitureDto } from '../../furniture/dto/furniture.dto';
import { BaseLayerDto, LayerShortDto } from '../../layers/dto/layer.dto';

export class FloorCreateRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiProperty()
  @IsInt()
  orderNumber: number;
}

export class FloorUpdateRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  orderNumber?: number;
}

export class FloorPlanPatchRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  removePhoto?: boolean;
}

export type FloorDto = {
  id: number;
  name: string;
  photoUrl: string | null;
  orderNumber: number;
};

export type FloorViewDto = {
  id: number;
  name: string;
  orderNumber: number;
  photoUrl: string | null;
  layers: LayerShortDto[];
  baseLayer: BaseLayerDto;
  furnitures: FurnitureDto[];
};
