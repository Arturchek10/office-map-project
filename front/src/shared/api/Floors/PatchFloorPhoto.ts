import { apiPatchFormData } from "@shared/utils/api"

export const updateFloorPlan = async (
  floorId: number,
  removePhoto: boolean,
  file?: File
) => {
  const formData = new FormData()

  // JSON-часть обязательно через Blob
  formData.append("data", JSON.stringify({ removePhoto }))

  if (file) {
    formData.append("photo", file) // ключ "photo" как в Swagger
  }

  return apiPatchFormData(`/api/v1/floors/plan/${floorId}`, formData)
}
