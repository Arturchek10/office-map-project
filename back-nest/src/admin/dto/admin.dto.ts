import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PromoteProjectAdminRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  login: string;
}

export class RevokeProjectAdminRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  login: string;
}

export type PendingUserDto = {
  id: number;
  email: string;
  role: string;
};
