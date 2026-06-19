import { createEffect } from "effector"
import { apiDelete } from "@shared/utils/api"

export const deleteOfficeFx = createEffect<number, number, Error>(
  async (officeId) => {
    const res = await apiDelete(`/api/v1/offices/${officeId}`)

    if (!res.ok) throw new Error(`Ошибка ${res.status}`)

    return officeId // Возвращаем ID удаленного офиса
  }
)
