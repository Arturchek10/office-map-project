
import {
  Marker,
  MarkerPayload,
  MarkerRequest,
  MarkerResponse,
  MarkerTypes,
} from "@shared/types/marker"
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPostFormData,
} from "@shared/utils/api"

type addMarkerParams = {
  marker: MarkerRequest
  layerId: number
}

// Добавление нового маркера на слой
export const addMarker = async ({
  marker,
  layerId,
}: addMarkerParams): Promise<Marker> => {
  const res = await apiPost(`/api/v1/markers/${layerId}`, marker)
  return res.json()
}

// Получение маркера по ID
// markerId - ID маркера, который нужно получить
export const getMarker = async (markerId: number): Promise<MarkerResponse> => {
  const res = await apiGet(`/api/v1/markers/${markerId}`)
  return res.json()
}

type ReplaceMarkerParams = {
  markerId: number
  position: { position_x: number; position_y: number }
}

export const replaceMarker = async ({
  markerId,
  position,
}: ReplaceMarkerParams): Promise<Marker> => {
  const res = await apiPatch(`/api/v1/markers/move/${markerId}`, { position })
  return res.json()
}

// Удаление маркера по ID
export const deleteMarker = async (markerId: number): Promise<number> => {
  await apiDelete(`/api/v1/markers/${markerId}`)
  return markerId
}


// обновление данных маркера
type UpdateMarkerParams = {
  name: string;
  markerId: number;
  type: MarkerTypes;
  payload?: MarkerPayload | Record<string, unknown>;
  pricePerHour?: number;
  uncomfortable?: boolean;
}

export const updateMarker = async ({ markerId, name, type, payload, pricePerHour, uncomfortable }: UpdateMarkerParams): Promise<MarkerResponse> => {
  const body: Record<string, unknown> = {}; // обязательно name в теле
  if (typeof name !== "undefined") body.name = name;
  if (typeof type !== "undefined") body.type = type;
  if (typeof payload !== "undefined") body.payload = payload;
  if (typeof pricePerHour !== "undefined") body.pricePerHour = pricePerHour;
  if (typeof uncomfortable !== "undefined") body.uncomfortable = uncomfortable;

  const res = await apiPatch(`/api/v1/markers/${markerId}`, body);

  if (!res.ok) {
    throw new Error(`Ошибка при обновлении маркера: ${res.status}`);
  }

  const data: MarkerResponse = await res.json();
  return data;
};

export const addMarkerPhotos = async (
  markerId: number,
  photos: File[],
): Promise<MarkerResponse> => {
  const formData = new FormData();
  photos.forEach((photo) => formData.append("photo", photo));

  const res = await apiPostFormData(`/api/v1/markers/${markerId}/photos`, formData);
  return res.json();
};

export const deleteMarkerPhoto = async (
  markerId: number,
  photoId: number,
): Promise<MarkerResponse> => {
  const res = await apiDelete(`/api/v1/markers/${markerId}/photos/${photoId}`);
  return res.json();
};
