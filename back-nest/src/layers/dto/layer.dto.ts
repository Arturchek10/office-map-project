import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { MarkerShortDto } from '../../markers/dto/marker.dto';

export class LayerCreateRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;
}

export class LayerUpdateRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;
}

export type LayerShortDto = {
  id: number;
  name: string;
  base: boolean;
};

export type LayerDto = {
  id: number;
  name: string;
  markers: MarkerShortDto[];
};

export type BaseLayerDto = {
  id: number;
  name: string;
  base: boolean;
  markers: MarkerShortDto[];
};
