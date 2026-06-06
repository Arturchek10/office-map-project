import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { FloorEntity } from '../floors/entities/floor.entity';
import { OfficesModule } from '../offices/offices.module';
import { FurnitureEntity } from './entities/furniture.entity';
import { FurnitureController } from './furniture.controller';
import { FurnitureService } from './furniture.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FurnitureEntity, FloorEntity]),
    OfficesModule,
    AuthModule,
  ],
  controllers: [FurnitureController],
  providers: [FurnitureService],
  exports: [FurnitureService, TypeOrmModule],
})
export class FurnitureModule {}
