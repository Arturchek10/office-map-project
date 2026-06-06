import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { RoleName } from '../../auth/entities/role.entity';

export class AdminRequestCreateDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 50)
  @Matches(/^\+?[0-9][0-9\s\-()]{6,24}$/, {
    message: 'Phone must contain only digits, spaces, brackets, dash and optional leading plus',
  })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  comment?: string;
}

export class RejectAdminRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  reason?: string;
}

export class ChangeUserRoleDto {
  @ApiProperty({ enum: [RoleName.ADMIN, RoleName.USER] })
  @IsString()
  @IsIn([RoleName.ADMIN, RoleName.USER])
  role: RoleName.ADMIN | RoleName.USER;
}

export class CreateAdminDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;
}

export class BlockUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}

export type AdminRequestDto = {
  id: number;
  userId: number;
  email: string;
  phone: string | null;
  comment: string | null;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
};

export type UserListItemDto = {
  id: number;
  email: string;
  name: string;
  role: RoleName;
  bannedAt: Date | null;
  bannedReason: string | null;
};

export type AdminOfficeDto = {
  id: number;
  name: string | null;
  address: string | null;
  city: string | null;
  deletedAt: Date | null;
  floorsCount: number;
};

export type PromoteProjectAdminRequestDto = {
  login: string;
};

export type RevokeProjectAdminRequestDto = {
  login: string;
};
