import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { FloorsModule } from './floors/floors.module';
import { FurnitureModule } from './furniture/furniture.module';
import { LayersModule } from './layers/layers.module';
import { MarkersModule } from './markers/markers.module';
import { OfficesModule } from './offices/offices.module';
import { SeedModule } from './seed/seed.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'map_service',
      autoLoadEntities: true,
      synchronize: true,
      logging: false,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    StorageModule,
    AuthModule,
    SeedModule,
    AdminModule,
    OfficesModule,
    FloorsModule,
    LayersModule,
    MarkersModule,
    FurnitureModule,
    BookingsModule,
  ],
})
export class AppModule {}
