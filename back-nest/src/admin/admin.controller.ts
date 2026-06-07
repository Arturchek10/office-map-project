import {
  Body,
  Controller,
  DefaultValuePipe,
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
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../auth/entities/role.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/types/auth-user';
import { BookingDto } from '../bookings/dto/booking.dto';
import { CursorResponse } from '../common/dto/cursor-response.dto';
import {
  AdminOfficeDto,
  AdminRequestCreateDto,
  AdminRequestDto,
  BlockUserDto,
  ChangeUserRoleDto,
  CreateAdminDto,
  RejectAdminRequestDto,
  UserListItemDto,
} from './dto/admin.dto';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('requests')
  @Roles(RoleName.USER)
  createAdminRequest(
    @Body() request: AdminRequestCreateDto,
    @CurrentUser() user: AuthUser,
  ): Promise<AdminRequestDto> {
    return this.adminService.createAdminRequest(request, Number(user.sub));
  }

  @Get('requests/my')
  @Roles(RoleName.USER)
  getMyAdminRequests(
    @CurrentUser() user: AuthUser,
  ): Promise<AdminRequestDto[]> {
    return this.adminService.getMyAdminRequests(Number(user.sub));
  }

  @Get('requests')
  @Roles(RoleName.SUPER_ADMIN)
  getAdminRequests(
    @Query('email') email?: string,
    @Query('cursor') cursor?: string,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size?: number,
  ): Promise<CursorResponse<AdminRequestDto>> {
    return this.adminService.getAdminRequests(email, cursor, size ?? 20);
  }

  @Post('admins')
  @Roles(RoleName.SUPER_ADMIN)
  createAdmin(@Body() request: CreateAdminDto): Promise<UserListItemDto> {
    return this.adminService.createAdmin(request);
  }

  @Get('my/offices')
  @Roles(RoleName.ADMIN)
  getMyAdminOffices(
    @CurrentUser() user: AuthUser,
    @Query('cursor') cursor?: string,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size?: number,
  ): Promise<CursorResponse<AdminOfficeDto>> {
    return this.adminService.getMyAdminOffices(
      Number(user.sub),
      cursor,
      size ?? 20,
    );
  }

  @Patch('requests/:requestId/approve')
  @Roles(RoleName.SUPER_ADMIN)
  approveAdminRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @CurrentUser() user: AuthUser,
  ): Promise<AdminRequestDto> {
    return this.adminService.approveAdminRequest(requestId, Number(user.sub));
  }

  @Patch('requests/:requestId/reject')
  @Roles(RoleName.SUPER_ADMIN)
  rejectAdminRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Body() request: RejectAdminRequestDto,
    @CurrentUser() user: AuthUser,
  ): Promise<AdminRequestDto> {
    return this.adminService.rejectAdminRequest(
      requestId,
      Number(user.sub),
      request.reason,
    );
  }

  @Get('users')
  @Roles(RoleName.SUPER_ADMIN)
  getUsers(
    @Query('email') email?: string,
    @Query('role') role?: RoleName,
    @Query('cursor') cursor?: string,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size?: number,
  ): Promise<CursorResponse<UserListItemDto>> {
    return this.adminService.getUsers({ email, role, cursor, size: size ?? 20 });
  }

  @Get('users/banned')
  @Roles(RoleName.SUPER_ADMIN)
  getBannedUsers(
    @Query('email') email?: string,
    @Query('cursor') cursor?: string,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size?: number,
  ): Promise<CursorResponse<UserListItemDto>> {
    return this.adminService.getBannedUsers(email, cursor, size ?? 20);
  }

  @Get('users/:userId/bookings')
  @Roles(RoleName.SUPER_ADMIN)
  getUserBookings(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<BookingDto[]> {
    return this.adminService.getUserBookings(userId);
  }

  @Patch('users/:userId/role')
  @Roles(RoleName.SUPER_ADMIN)
  changeUserRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() request: ChangeUserRoleDto,
  ): Promise<UserListItemDto> {
    return this.adminService.changeUserRole(userId, request.role);
  }

  @Post('users/:userId/block')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.SUPER_ADMIN)
  blockUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() request: BlockUserDto,
  ): Promise<UserListItemDto> {
    return this.adminService.blockUser(userId, request.reason);
  }

  @Post('users/:userId/unblock')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.SUPER_ADMIN)
  unblockUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserListItemDto> {
    return this.adminService.unblockUser(userId);
  }

  @Get('admins/:adminId/offices')
  @Roles(RoleName.SUPER_ADMIN)
  getAdminOffices(
    @Param('adminId', ParseIntPipe) adminId: number,
    @Query('cursor') cursor?: string,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size?: number,
  ): Promise<CursorResponse<AdminOfficeDto>> {
    return this.adminService.getAdminOffices(adminId, cursor, size ?? 20);
  }

  @Post('admins/:adminId/block-with-offices')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.SUPER_ADMIN)
  blockAdminWithOffices(
    @Param('adminId', ParseIntPipe) adminId: number,
    @Body() request: BlockUserDto,
  ): Promise<UserListItemDto> {
    return this.adminService.blockUser(adminId, request.reason, true);
  }

  @Post('admins/:adminId/unblock-with-offices')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.SUPER_ADMIN)
  unblockAdminWithOffices(
    @Param('adminId', ParseIntPipe) adminId: number,
  ): Promise<UserListItemDto> {
    return this.adminService.unblockUser(adminId, true);
  }

  @Get('offices/:officeId/bookings')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  getOfficeBookings(
    @Param('officeId', ParseIntPipe) officeId: number,
    @CurrentUser() user: AuthUser,
  ): Promise<BookingDto[]> {
    return this.adminService.getOfficeBookings(officeId, user);
  }
}
