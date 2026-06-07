import { apiGet, apiPost } from "@shared/utils/api"
import type { MarkerResponse, MarkerTypes } from "@shared/types/marker"
import type { CursorResponse } from "@shared/types/admin"

export type BookingPlace = {
  officeId: number
  officeName: string | null
  officeAddress: string | null
  floorId: number
  floorName: string
  floorOrderNumber: number
  floorPhotoUrl: string | null
  marker: {
    id: number
    name: string | null
    type: MarkerTypes | null
    pricePerHour: number
    position: {
      position_x: number
      position_y: number
    } | null
  }
}

export type Booking = {
  id: number
  markerId: number
  userId: number
  startTime: string
  endTime: string
  pricePerHour: number
  totalPrice: number
  status: string
  place: BookingPlace
}

export type BusyInterval = {
  id: number
  startTime: string
  endTime: string
}

export const createBooking = async (data: {
  markerId: number
  startTime: string
  endTime: string
}): Promise<Booking> => {
  const res = await apiPost("/api/v1/bookings", data)
  return res.json()
}

export const createBulkBooking = async (data: {
  markerIds: number[]
  startTime: string
  endTime: string
}): Promise<Booking[]> => {
  const res = await apiPost("/api/v1/bookings/bulk", data)
  return res.json()
}

export const getAvailableMarkersByFloor = async (
  floorId: number,
  startTime: string,
  endTime: string,
): Promise<MarkerResponse[]> => {
  const params = new URLSearchParams({ startTime, endTime })
  const res = await apiGet(
    `/api/v1/bookings/floor/${floorId}/available?${params.toString()}`,
  )
  const data = await res.json()
  return Array.isArray(data) ? data : data.markers ?? []
}

export const getMyBookings = async (
  params: {
    activeOnly?: boolean
    cursor?: number | null
    size?: number
  } = {},
): Promise<CursorResponse<Booking>> => {
  const query = new URLSearchParams({
    activeOnly: String(params.activeOnly ?? false),
    size: String(params.size ?? 20),
  })

  if (params.cursor) {
    query.set("cursor", String(params.cursor))
  }

  const res = await apiGet(`/api/v1/bookings/my?${query.toString()}`)
  return res.json()
}

export const getBookingById = async (bookingId: number): Promise<Booking> => {
  const res = await apiGet(`/api/v1/bookings/${bookingId}`)
  return res.json()
}

export const getMarkerBusyIntervals = async (
  markerId: number,
  date: string,
): Promise<BusyInterval[]> => {
  const res = await apiGet(
    `/api/v1/bookings/marker/${markerId}/day?date=${encodeURIComponent(date)}`,
  )
  return res.json()
}
