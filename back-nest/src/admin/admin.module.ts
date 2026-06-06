import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RoleEntity } from '../auth/entities/role.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { BookingsModule } from '../bookings/bookings.module';
import { OfficeEntity } from '../offices/entities/office.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminRequestEntity } from './entities/admin-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminRequestEntity,
      OfficeEntity,
      UserEntity,
      RoleEntity,
    ]),
    AuthModule,
    BookingsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
