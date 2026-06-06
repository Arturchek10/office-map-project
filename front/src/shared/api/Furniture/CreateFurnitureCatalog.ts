import { createEffect } from "effector"
import { apiPostFormData } from "@shared/utils/api"

export type FurnitureCreateRequest = {
  name: string
}

export type TFurnitureCatalogResponse = {
  id: number
  name: string
  photoUrl: string
}

// --- эффект для создания мебели в каталоге ---
export const createFurnitureCatalogFx = createEffect<
  { data: FurnitureCreateRequest; photo: File },
  TFurnitureCatalogResponse,
  Error
>(async ({ data, photo }) => {
  console.log("Отправляем запрос на создание мебели в каталоге:", {
    data,
    photoName: photo.name,
  })

  const formData = new FormData()
  formData.append("data", JSON.stringify(data))
  formData.append("photo", photo)

  const res = await apiPostFormData(`/api/v1/furniture`, formData)

  const text = await res.text()
  console.log("Ответ сервера:", text)

  if (!res.ok) {
    throw new Error(`Ошибка создания мебели в каталоге: ${res.status} ${text}`)
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error("Сервер вернул не-JSON ответ")
  }
})
