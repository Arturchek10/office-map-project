import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DescriptionEntity } from './entities/description.entity';
import { EmergencyDescriptionEntity } from './entities/emergency-description.entity';
import { RoomDescriptionEntity } from './entities/room-description.entity';
import { UtilityDescriptionEntity } from './entities/utility-description.entity';
import { WorkspaceDescriptionEntity } from './entities/workspace-description.entity';
import { DescriptionsService } from './descriptions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DescriptionEntity,
      RoomDescriptionEntity,
      WorkspaceDescriptionEntity,
      UtilityDescriptionEntity,
      EmergencyDescriptionEntity,
    ]),
  ],
  providers: [DescriptionsService],
  exports: [DescriptionsService, TypeOrmModule],
})
export class DescriptionsModule {}
