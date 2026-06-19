import { createStore, createEffect } from "effector"
import { apiGet } from "@shared/utils/api"

export type TOfficeFloor = {
  id: number
  name: string
  orderNumber: number
}

export type TOfficeDetails = {
  id: number
  name: string
  createdByUserId?: number | string | null
  startFloor: TOfficeFloor | null
  floors: TOfficeFloor[]
}

export const fetchOfficeByIdFx = createEffect<number, TOfficeDetails, Error>(
  async (officeId) => {
    const res = await apiGet(`/api/v1/offices/${officeId}`, {
      headers: { Accept: "application/json" },
    })

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

    if (!contentType.includes("application/json")) {
      throw new Error("Ответ сервера не в формате JSON")
    }

    const data = await res.json()
    console.log("Полученный офис:", data)

    return data
  }
)

export const $activeOffice = createStore<TOfficeDetails | null>(null).on(
  fetchOfficeByIdFx.doneData,
  (_, office) => office
)

export const $activeOfficeError = createStore<Error | null>(null)
  .on(fetchOfficeByIdFx.failData, (_, e) => e)
  .reset(fetchOfficeByIdFx.done)

export const $activeOfficeLoading = fetchOfficeByIdFx.pending
