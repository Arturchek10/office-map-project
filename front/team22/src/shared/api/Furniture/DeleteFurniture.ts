import { createEffect } from "effector"
import { apiDelete } from "@shared/utils/api"

export const deleteFurnitureFx = createEffect<number, void, Error>(
  async (furnitureId) => {
    console.log("эффект deleteFurnitureFx", furnitureId)
    const res = await apiDelete(`/api/v1/furniture/${furnitureId}`)
    if (!res.ok) throw new Error(`Ошибка ${res.status}`)
  }
)
