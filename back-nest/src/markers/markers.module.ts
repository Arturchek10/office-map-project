import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { LayerEntity } from '../layers/entities/layer.entity';
import { OfficesModule } from '../offices/offices.module';
import { MarkerEntity } from './entities/marker.entity';
import { MarkerPhotoEntity } from './entities/marker-photo.entity';
import { MarkersController } from './markers.controller';
import { MarkersService } from './markers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MarkerEntity, MarkerPhotoEntity, LayerEntity]),
    OfficesModule,
    AuthModule,
  ],
  controllers: [MarkersController],
  providers: [MarkersService],
  exports: [MarkersService, TypeOrmModule],
})
export class MarkersModule {}
