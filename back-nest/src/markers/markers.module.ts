import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DescriptionsModule } from '../descriptions/descriptions.module';
import { LayerEntity } from '../layers/entities/layer.entity';
import { MarkerEntity } from './entities/marker.entity';
import { MarkersController } from './markers.controller';
import { MarkersService } from './markers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MarkerEntity, LayerEntity]),
    DescriptionsModule,
  ],
  controllers: [MarkersController],
  providers: [MarkersService],
  exports: [MarkersService, TypeOrmModule],
})
export class MarkersModule {}
