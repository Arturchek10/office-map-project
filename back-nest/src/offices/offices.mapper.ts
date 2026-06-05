import { LocalFileStorageService } from '../storage/storage.service';
import { FloorEntity } from '../floors/entities/floor.entity';
import { OfficeEntity } from './entities/office.entity';
import { FloorShortDto, OfficeDto, OfficeShortDto } from './dto/office.dto';

export function toFloorShortDto(floor: FloorEntity): FloorShortDto {
  return {
    id: floor.id,
    name: floor.name,
    orderNumber: floor.orderNumber,
  };
}

export function toOfficeDto(
  office: OfficeEntity,
  storage: LocalFileStorageService,
): OfficeDto {
  return {
    id: office.id,
    name: office.name ?? null,
    address: office.address ?? null,
    latitude: office.latitude ?? null,
    longitude: office.longitude ?? null,
    city: office.city ?? null,
    photoUrl: storage.presignGet(office.photoKey),
    floorsCount: office.floors?.length ?? 0,
  };
}

export function toOfficeShortDto(office: OfficeEntity): OfficeShortDto {
  const floors = [...(office.floors ?? [])].sort(
    (a, b) => a.orderNumber - b.orderNumber,
  );
  const startFloor =
    floors
      .filter((floor) => floor.orderNumber >= 0)
      .sort((a, b) => a.orderNumber - b.orderNumber)
      .at(0) ?? null;

  return {
    id: office.id,
    name: office.name ?? null,
    startFloor: startFloor ? toFloorShortDto(startFloor) : null,
    floors: floors.map(toFloorShortDto),
  };
}
