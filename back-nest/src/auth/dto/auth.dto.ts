import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { RoleName } from '../entities/role.entity';

export class SignUpRequestDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;
}

export class SignInRequestDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export type AuthResponseDto = {
  token: string;
  refreshToken: string;
};

export type MeResponseDto = {
  id: string;
  email: string;
  name: string;
  role: RoleName;
};
