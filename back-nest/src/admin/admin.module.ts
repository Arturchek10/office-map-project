import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/entities/user.entity';
import { OfficeEntity } from '../offices/entities/office.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { OfficeAdminEntity } from './entities/office-admin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OfficeAdminEntity, OfficeEntity, UserEntity])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
