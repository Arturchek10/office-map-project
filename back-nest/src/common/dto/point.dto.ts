import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export type Point = {
  position_x: number;
  position_y: number;
};

export class PointDto {
  @ApiProperty()
  @IsNumber()
  position_x: number;

  @ApiProperty()
  @IsNumber()
  position_y: number;
}
