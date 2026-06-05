import { toPoint } from '../common/utils/point';
import { MarkerDto, MarkerShortDto, MarkerTypeValue } from './dto/marker.dto';
import { MarkerEntity } from './entities/marker.entity';

export function toMarkerShortDto(marker: MarkerEntity): MarkerShortDto {
  return {
    id: marker.id,
    position: toPoint(marker.positionX, marker.positionY),
    type: marker.type ? (marker.type as MarkerTypeValue) : null,
  };
}

export function toMarkerDto(
  marker: MarkerEntity,
  payload: MarkerDto['payload'],
): MarkerDto {
  return {
    id: marker.id,
    name: marker.name ?? null,
    type: marker.type ? (marker.type as MarkerTypeValue) : null,
    position: toPoint(marker.positionX, marker.positionY),
    uncomfortable: marker.uncomfortable === true,
    payload,
  };
}
