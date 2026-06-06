// floor.ts

import { createStore, createEffect, createEvent } from "effector";
import { ResponseCreateFloor } from "../types/floor";
// import * as floorApi from "../api/Floors/FloorApi";
import { getFloorById } from "@shared/api/Floors/GetFloorById";


// эффект загрузки этажа по ID
export const getFloorByIdFx = createEffect(getFloorById);

// эффект создания этажа. надо сделать
export const createFloorFx = createEffect();

// событие для смены картинки этажа
export const updateCurrentFloorPhotoUrl = createEvent<string>()

// текущий этаж
export const $currentFloor = createStore<ResponseCreateFloor | null>(null);
$currentFloor.on(getFloorByIdFx.doneData, (_, floor) => floor)
$currentFloor.on(updateCurrentFloorPhotoUrl, (state, photoUrl) => state ? {...state, photoUrl} : state)
