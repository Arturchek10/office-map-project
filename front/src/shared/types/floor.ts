import { Marker } from "./marker";
import { LayerType } from "./layer";

export type CreateFloor = {
  name: string;
  orderNumber: number;
};

export type ResponseCreateFloor = {
  id: number;
  name: string;
  orderNumber: number;
  photoUrl: null | string;
  layers: LayerType[],
  baseLayer: {
    id: number;
    name: string;
    base: boolean;
    markers: Marker[]
  },
  furnitures: any[]
}

export type PatchFloor = {
  photo?: File | null;
  removePhoto: boolean;
}

