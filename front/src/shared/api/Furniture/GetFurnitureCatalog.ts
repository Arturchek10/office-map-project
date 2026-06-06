import { createEffect, createStore, createEvent } from "effector"
import { apiGet } from "@shared/utils/api"

export type TFurnitureCatalogItem = {
  id: number
  name: string
  photoUrl: string
}

export type TFurnitureCatalogResponse = {
  content: TFurnitureCatalogItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// --- событие для ручного обновления каталога ---
export const setFurnitureCatalog = createEvent<TFurnitureCatalogItem[]>()

// --- эффект для получения каталога ---
export const getFurnitureCatalogFx = createEffect<
  void,
  TFurnitureCatalogItem[],
  Error
>(async () => {
  const res = await apiGet("/api/v1/furniture/catalog")

  if (!res.ok) throw new Error(`Ошибка ${res.status}`)

  const json: TFurnitureCatalogResponse = await res.json()
  return json.content
})

export const $furnitureCatalog = createStore<TFurnitureCatalogItem[]>([])
  .on(getFurnitureCatalogFx.doneData, (_, content) => content)
  .on(setFurnitureCatalog, (_, content) => content)
