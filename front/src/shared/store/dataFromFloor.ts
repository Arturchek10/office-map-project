import { getFloorById } from "@shared/api/Floors/GetFloorById";
import { ResponseCreateFloor } from "@shared/types/floor";
import {createStore, createEffect} from "effector";

export const getFloorByIdFx = createEffect(getFloorById)

export const $floorData = createStore<ResponseCreateFloor | null>(null);
$floorData.on(getFloorByIdFx.doneData, (_, floor) => floor);  

export const $markers = $floorData.map(floor => floor?.baseLayer?.markers || []);
export const $furnitures = $floorData.map(floor => floor?.furnitures || []);