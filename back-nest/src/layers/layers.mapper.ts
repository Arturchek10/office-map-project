import { MarkerEntity } from '../markers/entities/marker.entity';
import { toMarkerShortDto } from '../markers/markers.mapper';
import { BaseLayerDto, LayerDto, LayerShortDto } from './dto/layer.dto';
import { LayerEntity } from './entities/layer.entity';

export function toLayerShortDto(layer: LayerEntity): LayerShortDto {
  return {
    id: layer.id,
    name: layer.name,
    base: layer.base,
  };
}

export function toLayerDto(layer: LayerEntity): LayerDto {
  return {
    id: layer.id,
    name: layer.name,
    markers: (layer.markers ?? []).map(toMarkerShortDto),
  };
}

export function toBaseLayerDto(
  layer: LayerEntity,
  markers: MarkerEntity[],
): BaseLayerDto {
  return {
    id: layer.id,
    name: layer.name,
    base: true,
    markers: markers.map(toMarkerShortDto),
  };
}
