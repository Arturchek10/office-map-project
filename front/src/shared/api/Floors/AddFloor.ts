import { createEffect, createStore } from "effector"
import { apiPost } from "@shared/utils/api"

export type TMarker = {
  id: number
  position: {
    position_x: number
    position_y: number
  }
  type: string
}

export type TLayer = {
  id: number
  name: string
  base: boolean
  markers?: TMarker[]
}

export type TFurniture = {
  id: number
  name: string
  photoUrl: string
  angle: number
  position: {
    position_x: number
    position_y: number
  }
  sizeFactor: number
}

export type TFloorDetails = {
  id: number
  name: string
  orderNumber: number
  photoUrl: string
  layers: TLayer[]
  baseLayer: TLayer & { markers: TMarker[] }
  furnitures: TFurniture[]
}

export type TNewFloor = {
  name: string
  orderNumber: number
}

export const addFloorFx = createEffect<
  { officeId: number; floor: TNewFloor },
  TFloorDetails,
  Error
>(async ({ officeId, floor }) => {
  const res = await apiPost(`/api/v1/floors/${officeId}`, floor, {
    headers: { Accept: "application/json" },
  })
  
  console.log(officeId);
  
  const contentType = res.headers.get("content-type") || ""

  if (!res.ok) {
    let errorMessage = `Ошибка ${res.status}`

    if (contentType.includes("application/json")) {
      const errorData = await res.json()
      errorMessage = errorData.message || errorMessage
    } else {
      const textData = await res.text()
      if (textData) errorMessage = textData
    }
    throw new Error(errorMessage)
  }

  return (await res.json()) as TFloorDetails
})

export const $activeFloor = createStore<TFloorDetails | null>(null)
.on(addFloorFx.doneData, (_, floor) => floor)
