import { createEffect } from "effector"
import { apiPatch } from "@shared/utils/api"

export type FurnitureUIData = {
  angle: number
  sizeFactor: number
}

export type TFurnitureUIResponse = {
  id: number
  angle: number
  sizeFactor: number
}

// --- эффект для обновления UI мебели ---
export const updateFurnitureUIFx = createEffect<
  { furnitureId: number; data: FurnitureUIData },
  TFurnitureUIResponse,
  Error
>(async ({ furnitureId, data }) => {
  const res = await apiPatch(`/api/v1/furniture/ui/${furnitureId}`, {
    angle: data.angle,
    sizeFactor: data.sizeFactor,
  })
  console.log(data.sizeFactor)
  const text = await res.text()
  console.log("Ответ сервера (UI):", text)

  if (!res.ok) {
    throw new Error(`Ошибка обновления UI мебели: ${res.status} ${text}`)
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error("Сервер вернул не-JSON ответ")
  }
})
