import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { FurnitureEntity } from '../furniture/entities/furniture.entity';
import { LayersModule } from '../layers/layers.module';
import { LayerEntity } from '../layers/entities/layer.entity';
import { MarkerEntity } from '../markers/entities/marker.entity';
import { OfficeEntity } from '../offices/entities/office.entity';
import { OfficesModule } from '../offices/offices.module';
import { FloorEntity } from './entities/floor.entity';
import { FloorsController } from './floors.controller';
import { FloorsService } from './floors.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FloorEntity,
      OfficeEntity,
      LayerEntity,
      MarkerEntity,
      FurnitureEntity,
    ]),
    LayersModule,
    OfficesModule,
    AuthModule,
  ],
  controllers: [FloorsController],
  providers: [FloorsService],
  exports: [FloorsService, TypeOrmModule],
})
export class FloorsModule {}
