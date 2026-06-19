import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { RoleEntity, RoleName } from '../auth/entities/role.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { AuthUser } from '../auth/types/auth-user';
import { BookingDto } from '../bookings/dto/booking.dto';
import { BookingsService } from '../bookings/bookings.service';
import {
  CursorResponse,
  toCursorResponse,
} from '../common/dto/cursor-response.dto';
import { OfficeEntity } from '../offices/entities/office.entity';
import { LocalFileStorageService } from '../storage/storage.service';
import {
  AdminOfficeDto,
  AdminRequestCreateDto,
  AdminRequestDto,
  CreateAdminDto,
  UserListItemDto,
} from './dto/admin.dto';
import {
  AdminRequestEntity,
  AdminRequestStatus,
} from './entities/admin-request.entity';

type UserQuery = {
  email?: string;
  role?: RoleName;
  cursor?: string;
  size: number;
};

@Injectable()
export class AdminService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(AdminRequestEntity)
    private readonly adminRequestRepository: Repository<AdminRequestEntity>,
    @InjectRepository(OfficeEntity)
    private readonly officeRepository: Repository<OfficeEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly bookingsService: BookingsService,
    private readonly storage: LocalFileStorageService,
  ) {}

  async createAdmin(request: CreateAdminDto): Promise<UserListItemDto> {
    const exists = await this.userRepository.findOne({
      where: { email: request.email },
    });
    if (exists) {
      throw new ConflictException('User with this email already exists');
    }

    const role = await this.getRole(RoleName.ADMIN);
    const admin = await this.userRepository.save(
      this.userRepository.create({
        email: request.email,
        name: request.name,
        password: await bcrypt.hash(request.password, this.saltRounds),
        role,
        roleId: role.id,
      }),
    );
    admin.role = role;

    return this.toUserDto(admin);
  }

  async createAdminRequest(
    request: AdminRequestCreateDto,
    userId: number,
  ): Promise<AdminRequestDto> {
    const user = await this.findUser(userId);
    if (user.role.name !== RoleName.USER) {
      throw new ConflictException('Only regular users can request admin status');
    }

    const exists = await this.adminRequestRepository.exists({
      where: { userId, status: AdminRequestStatus.PENDING },
    });
    if (exists) {
      throw new ConflictException('Admin request is already pending');
    }

    const saved = await this.adminRequestRepository.save(
      this.adminRequestRepository.create({
        userId,
        user,
        email: request.email,
        phone: request.phone,
        comment: request.comment,
        status: AdminRequestStatus.PENDING,
      }),
    );

    return this.toAdminRequestDto(saved);
  }

  async getMyAdminRequests(userId: number): Promise<AdminRequestDto[]> {
    const requests = await this.adminRequestRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return requests.map((request) => this.toAdminRequestDto(request));
  }

  async getAdminRequests(
    email: string | undefined,
    cursor: string | undefined,
    size: number,
  ): Promise<CursorResponse<AdminRequestDto>> {
    const safeSize = this.safeSize(size);
    const query = this.adminRequestRepository
      .createQueryBuilder('request')
      .where('request.id > :cursor', { cursor: this.parseCursor(cursor) })
      .orderBy('request.id', 'ASC')
      .take(safeSize + 1);

    if (email?.trim()) {
      query.andWhere('LOWER(request.email) LIKE LOWER(:email)', {
        email: `%${email.trim()}%`,
      });
    }

    const items = await query.getMany();
    return toCursorResponse(items.map((item) => this.toAdminRequestDto(item)), safeSize);
  }

  async approveAdminRequest(
    requestId: number,
    reviewedByUserId: number,
  ): Promise<AdminRequestDto> {
    const request = await this.findAdminRequest(requestId);
    if (request.status !== AdminRequestStatus.PENDING) {
      throw new ConflictException('Admin request is already reviewed');
    }

    await this.changeUserRole(request.userId, RoleName.ADMIN);
    request.status = AdminRequestStatus.APPROVED;
    request.reviewedByUserId = reviewedByUserId;
    request.reviewedAt = new Date();

    return this.toAdminRequestDto(await this.adminRequestRepository.save(request));
  }

  async rejectAdminRequest(
    requestId: number,
    reviewedByUserId: number,
    reason?: string,
  ): Promise<AdminRequestDto> {
    const request = await this.findAdminRequest(requestId);
    if (request.status !== AdminRequestStatus.PENDING) {
      throw new ConflictException('Admin request is already reviewed');
    }

    request.status = AdminRequestStatus.REJECTED;
    request.reviewedByUserId = reviewedByUserId;
    request.reviewedAt = new Date();
    if (reason) {
      request.comment = `${request.comment ?? ''}\n\nReject reason: ${reason}`.trim();
    }

    return this.toAdminRequestDto(await this.adminRequestRepository.save(request));
  }

  async getUsers(query: UserQuery): Promise<CursorResponse<UserListItemDto>> {
    const safeSize = this.safeSize(query.size);
    const builder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id > :cursor', { cursor: this.parseCursor(query.cursor) })
      .andWhere('user.deleted_at IS NULL')
      .orderBy('user.id', 'ASC')
      .take(safeSize + 1);

    if (query.email?.trim()) {
      builder.andWhere('LOWER(user.email) LIKE LOWER(:email)', {
        email: `%${query.email.trim()}%`,
      });
    }
    if (query.role) {
      builder.andWhere('role.name = :role', { role: query.role });
    }

    const users = await builder.getMany();
    return toCursorResponse(users.map((user) => this.toUserDto(user)), safeSize);
  }

  async getBannedUsers(
    email: string | undefined,
    cursor: string | undefined,
    size: number,
  ): Promise<CursorResponse<UserListItemDto>> {
    const safeSize = this.safeSize(size);
    const builder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id > :cursor', { cursor: this.parseCursor(cursor) })
      .andWhere('user.banned_at IS NOT NULL')
      .orderBy('user.id', 'ASC')
      .take(safeSize + 1);

    if (email?.trim()) {
      builder.andWhere('LOWER(user.email) LIKE LOWER(:email)', {
        email: `%${email.trim()}%`,
      });
    }

    const users = await builder.getMany();
    return toCursorResponse(users.map((user) => this.toUserDto(user)), safeSize);
  }

  async changeUserRole(
    userId: number,
    roleName: RoleName.ADMIN | RoleName.USER,
  ): Promise<UserListItemDto> {
    const user = await this.findUser(userId);
    if (user.role.name === RoleName.SUPER_ADMIN) {
      throw new ConflictException('Cannot change super admin role');
    }

    const role = await this.getRole(roleName);
    user.role = role;
    user.roleId = role.id;
    return this.toUserDto(await this.userRepository.save(user));
  }

  async blockUser(
    userId: number,
    reason?: string,
    includeOffices = false,
  ): Promise<UserListItemDto> {
    const user = await this.findUser(userId);
    if (user.role.name === RoleName.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot block super admin');
    }

    user.bannedAt = new Date();
    user.bannedReason = reason;
    await this.userRepository.save(user);

    if (includeOffices || user.role.name === RoleName.ADMIN) {
      await this.softDeleteAdminOffices(user.id);
    }

    return this.toUserDto(user);
  }

  async unblockUser(
    userId: number,
    restoreOffices = false,
  ): Promise<UserListItemDto> {
    const user = await this.findUser(userId);
    user.bannedAt = null;
    user.bannedReason = null;
    await this.userRepository.save(user);

    if (restoreOffices || user.role.name === RoleName.ADMIN) {
      await this.restoreAdminOffices(user.id);
    }

    return this.toUserDto(user);
  }

  async getAdminOffices(
    adminId: number,
    cursor: string | undefined,
    size: number,
  ): Promise<CursorResponse<AdminOfficeDto>> {
    const admin = await this.findUser(adminId);
    if (admin.role.name !== RoleName.ADMIN) {
      throw new ConflictException('Selected user is not an admin');
    }

    const safeSize = this.safeSize(size);
    const offices = await this.officeRepository
      .createQueryBuilder('office')
      .withDeleted()
      .leftJoinAndSelect('office.floors', 'floor')
      .where('office.created_by_user_id = :adminId', { adminId })
      .andWhere('office.id > :cursor', { cursor: this.parseCursor(cursor) })
      .orderBy('office.id', 'ASC')
      .take(safeSize + 1)
      .getMany();

    return toCursorResponse(offices.map((office) => this.toAdminOfficeDto(office)), safeSize);
  }

  async getMyAdminOffices(
    adminId: number,
    cursor: string | undefined,
    size: number,
  ): Promise<CursorResponse<AdminOfficeDto>> {
    const safeSize = this.safeSize(size);
    const offices = await this.officeRepository
      .createQueryBuilder('office')
      .leftJoinAndSelect('office.floors', 'floor')
      .where('office.created_by_user_id = :adminId', { adminId })
      .andWhere('office.id > :cursor', { cursor: this.parseCursor(cursor) })
      .orderBy('office.id', 'ASC')
      .take(safeSize + 1)
      .getMany();

    return toCursorResponse(offices.map((office) => this.toAdminOfficeDto(office)), safeSize);
  }

  getUserBookings(userId: number): Promise<BookingDto[]> {
    return this.bookingsService.getUserBookings(userId, false);
  }

  async getOfficeBookings(
    officeId: number,
    user: AuthUser,
  ): Promise<BookingDto[]> {
    if (user.role === RoleName.ADMIN) {
      const ownsOffice = await this.officeRepository.exists({
        where: { id: officeId, createdByUserId: Number(user.sub) },
      });
      if (!ownsOffice) {
        throw new ForbiddenException('Office belongs to another admin');
      }
    }

    return this.bookingsService.getOfficeBookings(officeId);
  }

  private async softDeleteAdminOffices(adminId: number): Promise<void> {
    await this.officeRepository
      .createQueryBuilder()
      .softDelete()
      .where('created_by_user_id = :adminId', { adminId })
      .execute();
  }

  private async restoreAdminOffices(adminId: number): Promise<void> {
    await this.officeRepository
      .createQueryBuilder()
      .restore()
      .where('created_by_user_id = :adminId', { adminId })
      .execute();
  }

  private async findAdminRequest(requestId: number): Promise<AdminRequestEntity> {
    const request = await this.adminRequestRepository.findOne({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException(`Admin request with id=${requestId} not found`);
    }
    return request;
  }

  private async findUser(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { role: true },
    });
    if (!user) {
      throw new NotFoundException(`User with id=${userId} not found`);
    }
    return user;
  }

  private async getRole(name: RoleName): Promise<RoleEntity> {
    const role = await this.roleRepository.findOne({ where: { name } });
    if (!role) {
      throw new NotFoundException(`Role ${name} not found`);
    }
    return role;
  }

  private parseCursor(cursor?: string): number {
    const parsed = Number(cursor ?? 0);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  private safeSize(size: number): number {
    return Math.max(1, Math.min(size, 100));
  }

  private toAdminRequestDto(request: AdminRequestEntity): AdminRequestDto {
    return {
      id: request.id,
      userId: request.userId,
      email: request.email,
      phone: request.phone ?? null,
      comment: request.comment ?? null,
      status: request.status,
      createdAt: request.createdAt,
      reviewedAt: request.reviewedAt ?? null,
    };
  }

  private toUserDto(user: UserEntity): UserListItemDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      bannedAt: user.bannedAt ?? null,
      bannedReason: user.bannedReason ?? null,
    };
  }

  private toAdminOfficeDto(office: OfficeEntity): AdminOfficeDto {
    return {
      id: office.id,
      name: office.name ?? null,
      address: office.address ?? null,
      city: office.city ?? null,
      latitude: office.latitude ?? null,
      longitude: office.longitude ?? null,
      photoUrl: this.storage.presignGet(office.photoKey),
      createdByUserId: office.createdByUserId ?? null,
      deletedAt: office.deletedAt ?? null,
      floorsCount: office.floors?.length ?? 0,
    };
  }
}
