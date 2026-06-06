import {createEffect} from "effector";
import { addMarker, deleteMarker, replaceMarker, updateMarker } from "@shared/api/markers";
import {$floorData} from "@shared/store/dataFromFloor"
import { ResponseCreateFloor } from "@shared/types/floor";


export const addMarkerFx = createEffect(addMarker)
export const replaceMarkerFx = createEffect(replaceMarker)
export const deleteMarkerFx = createEffect(deleteMarker)
export const updateMarkerFx = createEffect(updateMarker)

$floorData.on(addMarkerFx.doneData, (floor, newMarker) => {
  if (!floor) return floor

  return {
    ...floor,
    baseLayer: {
      ...floor.baseLayer,
      markers: [...(floor.baseLayer?.markers || []), newMarker],
    }
  }
});


$floorData.on(deleteMarkerFx.doneData, (floor, markerId) => {
  if (!floor) return floor

  return {
    ...floor,
    baseLayer: {
      ...floor.baseLayer,
      markers: floor.baseLayer?.markers.filter(m => m.id !== markerId) || [],
    }
  }
});

$floorData.on(updateMarkerFx.doneData, (floor, updatedMarker) => {
  if (!floor) return floor;

  // Проверяем, есть ли baseLayer
  if (!floor.baseLayer) return floor;

  return {
    ...floor,
    baseLayer: {
      ...floor.baseLayer,
      markers: floor.baseLayer.markers.map(m =>
        m.id === updatedMarker.id ? updatedMarker : m
      ),
    },
  } as ResponseCreateFloor; // вот здесь говорим TypeScript, что это точно ResponseCreateFloor
});