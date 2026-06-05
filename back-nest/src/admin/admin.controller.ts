import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user';
import { PageResponse } from '../common/dto/page-response.dto';
import {
  PendingUserDto,
  PromoteProjectAdminRequestDto,
  RevokeProjectAdminRequestDto,
} from './dto/admin.dto';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users/pending')
  getPendingUsers(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size: number,
  ): Promise<PageResponse<PendingUserDto>> {
    return this.adminService.getPendingUsers(page, size);
  }

  @Patch('users/confirm/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    await this.adminService.confirmUser(userId);
  }

  @Delete('users/decline/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async declineUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    await this.adminService.declineUser(userId);
  }

  @Post(':officeId')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard)
  async promoteProjectAdmin(
    @Param('officeId', ParseIntPipe) officeId: number,
    @Body() request: PromoteProjectAdminRequestDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    await this.adminService.promoteProjectAdmin(
      officeId,
      request,
      user?.email ?? user?.sub ?? 'system',
    );
  }

  @Delete(':officeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeProjectAdmin(
    @Param('officeId', ParseIntPipe) officeId: number,
    @Body() request: RevokeProjectAdminRequestDto,
  ): Promise<void> {
    await this.adminService.revokeProjectAdmin(officeId, request);
  }
}
