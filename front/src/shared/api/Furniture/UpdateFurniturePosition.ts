import { createEffect } from "effector"
import { apiPatch } from "@shared/utils/api"

export type FurniturePositionData = {
  position_x: number
  position_y: number
}

export type TFurniturePositionResponse = {
  id: number
  position: {
    position_x: number
    position_y: number
  }
}

// --- эффект для обновления позиции мебели ---
export const updateFurniturePositionFx = createEffect<
  { furnitureId: number; data: FurniturePositionData },
  TFurniturePositionResponse,
  Error
>(async ({ furnitureId, data }) => {
  const res = await apiPatch(`/api/v1/furniture/move/${furnitureId}`, {
    position: {
      position_x: data.position_x,
      position_y: data.position_y,
    },
  })

  const text = await res.text()
  console.log("Ответ сервера (позиция):", text)

  if (!res.ok) {
    throw new Error(`Ошибка обновления позиции мебели: ${res.status} ${text}`)
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error("Сервер вернул не-JSON ответ")
  }
})
