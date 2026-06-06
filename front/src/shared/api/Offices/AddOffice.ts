import { createEffect } from "effector"
import { TOffice } from "@entities/Office/type/office"
import { apiPostFormData } from "@shared/utils/api"

export const addOfficeFx = createEffect<FormData, TOffice, Error>(
  async (formData) => {
    try {
      const res = await apiPostFormData("/api/v1/offices", formData, {
        headers: { Accept: "application/json" },
      })

      console.log('status', res.status);
      console.log('content-type', res.headers.get("content-type"))
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

      return await res.json()
    } catch (e) {
      // надо ловить ошибку и выводить на фронт
      console.error("Ошибка создания офиса:", e)
      throw e
    }
  }
)
