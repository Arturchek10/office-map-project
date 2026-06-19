import { createEffect } from "effector"
import { apiGet, apiPost } from "@shared/utils/api"

export type FurnitureData = {
  name: string
  position: { position_x: number; position_y: number }
  photoUrl: string
  
}

export type TFurnitureResponse = {
  id: number
  name: string
  photoUrl: string
  angle: number
  position: { position_x: number; position_y: number }
  sizeFactor: number
}

// --- утилита ---
export async function urlToFile(url: string, fileName: string): Promise<File> {
  const res = await apiGet(url)
  if (!res.ok) {
    throw new Error(`Не удалось загрузить файл по адресу ${url}`)
  }
  const blob = await res.blob()
  return new File([blob], fileName, { type: blob.type })
}

// --- эффект для сохранения мебели ---
export const addFurnitureFx = createEffect<
  { floorId: number; data: FurnitureData },
  TFurnitureResponse,
  Error
>(async ({ floorId, data }) => {
  console.log("Отправляем запрос на добавление мебели:", {
    floorId,
    data,
    photoUrl: data.photoUrl,
  })

  const requestBody = {
    name: data.name,
    position: data.position,
    photoUrl: data.photoUrl,
  }

  console.log("Тело запроса:", requestBody)

  const res = await apiPost(`/api/v1/furniture/${floorId}`, requestBody)

  const text = await res.text() // читаем ответ как текст
  console.log("Ответ сервера:", text)

  if (!res.ok) {
    throw new Error(`Ошибка сохранения мебели: ${res.status} ${text}`)
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error("Сервер вернул не-JSON ответ")
  }
})
