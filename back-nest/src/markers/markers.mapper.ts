import { toPoint } from '../common/utils/point';
import { LocalFileStorageService } from '../storage/storage.service';
import { MarkerDto, MarkerShortDto, MarkerTypeValue } from './dto/marker.dto';
import { MarkerEntity } from './entities/marker.entity';

export function toMarkerShortDto(marker: MarkerEntity): MarkerShortDto {
  return {
    id: marker.id,
    position: toPoint(marker.positionX, marker.positionY),
    type: marker.type ? (marker.type as MarkerTypeValue) : null,
    pricePerHour: Number(marker.pricePerHour ?? 0),
  };
}

export function toMarkerDto(
  marker: MarkerEntity,
  storage: LocalFileStorageService,
): MarkerDto {
  const photos = (marker.photos ?? [])
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
    .map((photo) => ({
      id: photo.id,
      url: storage.presignGet(photo.photoKey) ?? '',
    }))
    .filter((photo) => photo.url !== '');

  return {
    id: marker.id,
    name: marker.name ?? null,
    type: marker.type ? (marker.type as MarkerTypeValue) : null,
    position: toPoint(marker.positionX, marker.positionY),
    pricePerHour: Number(marker.pricePerHour ?? 0),
    uncomfortable: marker.uncomfortable === true,
    payload: (marker.payload as MarkerDto['payload']) ?? null,
    photos,
    photoUrls: photos.map((photo) => photo.url),
  };
}
