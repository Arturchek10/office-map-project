import { apiGet } from "@shared/utils/api"
import { LayerType } from "@shared/types/layer"
import { Marker } from "@shared/types/marker"

type ResponseCreateFloor = {
  id: number
  name: string
  orderNumber: number
  photoUrl: null | string
  layers: LayerType[]
  baseLayer: {
    id: number
    name: string
    base: boolean
    markers: Marker[]
  }
  furnitures: any[]
}

// response будет содержать photoUrl, layers, baseLayer, markers, furnitures
export const getFloorById = async (
  floorId: number
): Promise<ResponseCreateFloor> => {
  const res = await apiGet(`/api/v1/floors/${floorId}`)
  return res.json()
}
