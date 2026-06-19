import { LocalFileStorageService } from '../storage/storage.service';
import { FloorDto, FloorViewDto } from './dto/floor.dto';
import { FloorEntity } from './entities/floor.entity';
import { toFurnitureDto } from '../furniture/furniture.mapper';
import { toBaseLayerDto, toLayerShortDto } from '../layers/layers.mapper';
import { LayerEntity } from '../layers/entities/layer.entity';
import { MarkerEntity } from '../markers/entities/marker.entity';

export function toFloorDto(
  floor: FloorEntity,
  storage: LocalFileStorageService,
): FloorDto {
  return {
    id: floor.id,
    name: floor.name,
    orderNumber: floor.orderNumber,
    photoUrl: storage.presignGet(floor.photoKey),
  };
}

export function toFloorViewDto(
  floor: FloorEntity,
  layers: LayerEntity[],
  baseLayer: LayerEntity,
  allMarkers: MarkerEntity[],
  storage: LocalFileStorageService,
): FloorViewDto {
  return {
    id: floor.id,
    name: floor.name,
    orderNumber: floor.orderNumber,
    photoUrl: storage.presignGet(floor.photoKey),
    layers: layers.map(toLayerShortDto),
    baseLayer: toBaseLayerDto(baseLayer, allMarkers),
    furnitures: (floor.furnitures ?? []).map((item) =>
      toFurnitureDto(item, storage),
    ),
  };
}
