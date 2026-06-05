import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FloorEntity } from '../floors/entities/floor.entity';
import { FurnitureEntity } from './entities/furniture.entity';
import { FurnitureController } from './furniture.controller';
import { FurnitureService } from './furniture.service';

@Module({
  imports: [TypeOrmModule.forFeature([FurnitureEntity, FloorEntity])],
  controllers: [FurnitureController],
  providers: [FurnitureService],
  exports: [FurnitureService, TypeOrmModule],
})
export class FurnitureModule {}
