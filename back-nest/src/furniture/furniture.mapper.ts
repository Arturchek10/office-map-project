import { toPoint } from '../common/utils/point';
import { LocalFileStorageService } from '../storage/storage.service';
import { FurnitureDto, FurnitureShortDto } from './dto/furniture.dto';
import { FurnitureEntity } from './entities/furniture.entity';

export function toFurnitureDto(
  furniture: FurnitureEntity,
  storage: LocalFileStorageService,
): FurnitureDto {
  return {
    id: furniture.id,
    name: furniture.name,
    photoUrl: storage.presignGet(furniture.photoKey),
    angle: furniture.angle ?? 0,
    position: toPoint(furniture.positionX, furniture.positionY),
    sizeFactor: furniture.sizeFactor ?? 1,
  };
}

export function toFurnitureShortDto(
  furniture: FurnitureEntity,
  storage: LocalFileStorageService,
): FurnitureShortDto {
  return {
    id: furniture.id,
    name: furniture.name,
    photoUrl: storage.presignGet(furniture.photoKey),
  };
}
