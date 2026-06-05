import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity';
import { PageResponse, toPageResponse } from '../common/dto/page-response.dto';
import { OfficeEntity } from '../offices/entities/office.entity';
import {
  PendingUserDto,
  PromoteProjectAdminRequestDto,
  RevokeProjectAdminRequestDto,
} from './dto/admin.dto';
import { OfficeAdminEntity } from './entities/office-admin.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(OfficeAdminEntity)
    private readonly officeAdminRepository: Repository<OfficeAdminEntity>,
    @InjectRepository(OfficeEntity)
    private readonly officeRepository: Repository<OfficeEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async promoteProjectAdmin(
    officeId: number,
    request: PromoteProjectAdminRequestDto,
    createdBy = 'system',
  ): Promise<void> {
    const officeExists = await this.officeRepository.exists({
      where: { id: officeId },
    });

    if (!officeExists) {
      throw new NotFoundException(`Office with id=${officeId} not found`);
    }

    const exists = await this.officeAdminRepository.exists({
      where: { officeId, login: request.login },
    });

    if (exists) {
      return;
    }

    await this.officeAdminRepository.save(
      this.officeAdminRepository.create({
        officeId,
        login: request.login,
        createdBy,
        createdAt: new Date(),
      }),
    );
  }

  async revokeProjectAdmin(
    officeId: number,
    request: RevokeProjectAdminRequestDto,
  ): Promise<void> {
    const officeExists = await this.officeRepository.exists({
      where: { id: officeId },
    });

    if (!officeExists) {
      throw new NotFoundException('Office not found');
    }

    const record = await this.officeAdminRepository.findOne({
      where: { officeId, login: request.login },
    });

    if (record) {
      await this.officeAdminRepository.remove(record);
    }
  }

  async getPendingUsers(
    page: number,
    size: number,
  ): Promise<PageResponse<PendingUserDto>> {
    const safePage = Math.max(0, page);
    const safeSize = Math.max(1, Math.min(size, 100));

    const [users, total] = await this.userRepository.findAndCount({
      where: { role: 'PENDING' },
      order: { id: 'ASC' },
      skip: safePage * safeSize,
      take: safeSize,
    });

    return toPageResponse(users.map(this.toPendingUserDto), total, safePage, safeSize);
  }

  async confirmUser(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with id=${userId} not found`);
    }

    if (user.role !== 'PENDING') {
      user.role = 'USER';
    } else {
      user.role = 'USER';
    }

    await this.userRepository.save(user);
  }

  async declineUser(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with id=${userId} not found`);
    }

    if (user.role === 'ADMIN') {
      throw new ConflictException('Cannot decline admin user');
    }

    await this.userRepository.remove(user);
  }

  private toPendingUserDto(user: UserEntity): PendingUserDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
