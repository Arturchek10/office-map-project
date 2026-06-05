import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FloorEntity } from '../floors/entities/floor.entity';
import { LayerEntity } from './entities/layer.entity';
import { LayersController } from './layers.controller';
import { LayersService } from './layers.service';

@Module({
  imports: [TypeOrmModule.forFeature([LayerEntity, FloorEntity])],
  controllers: [LayersController],
  providers: [LayersService],
  exports: [LayersService, TypeOrmModule],
})
export class LayersModule {}
