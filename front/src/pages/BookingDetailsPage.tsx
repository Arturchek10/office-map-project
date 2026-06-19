import Header from "@entities/Header/Header"
import NavBar from "@entities/NavBar/NavBar"
import { drawerWidth } from "@features/OfficesBar/config/config"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong"
import ZoomInIcon from "@mui/icons-material/ZoomIn"
import ZoomOutIcon from "@mui/icons-material/ZoomOut"
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  CssBaseline,
  IconButton,
  ImageList,
  ImageListItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material"
import { getBookingById, type Booking } from "@shared/api/Bookings"
import { getFloorById } from "@shared/api/Floors/GetFloorById"
import type { ResponseCreateFloor } from "@shared/types/floor"
import { markerColor, type MarkerResponse } from "@shared/types/marker"
import { getImageUrl } from "@shared/utils/getImageUrl"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const markerTypeLabel: Record<string, string> = {
  workspace: "Рабочее место",
  room: "Переговорная",
  emergency: "Аварийная точка",
  utility: "Утилита",
}

export default function BookingDetailsPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [floor, setFloor] = useState<ResponseCreateFloor | null>(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [schemeScale, setSchemeScale] = useState(1)
  const [schemePosition, setSchemePosition] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const dragStartRef = useRef<{
    pointerX: number
    pointerY: number
    positionX: number
    positionY: number
  } | null>(null)

  useEffect(() => {
    const id = Number(bookingId)
    if (!Number.isFinite(id)) {
      setError("Некорректный номер аренды")
      setLoading(false)
      return
    }

    getBookingById(id)
      .then(async (nextBooking) => {
        setBooking(nextBooking)
        resetSchemeView()
        setFloor(await getFloorById(nextBooking.place.floorId))
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Не удалось загрузить аренду",
        ),
      )
      .finally(() => setLoading(false))
  }, [bookingId])

  const floorImageUrl = getImageUrl(floor?.photoUrl)
  const allMarkers = useMemo(() => floor?.baseLayer.markers ?? [], [floor])
  const bookedMarker = useMemo(() => {
    if (!booking) return null
    return allMarkers.find((marker) => marker.id === booking.markerId) ?? null
  }, [allMarkers, booking])
  const fallbackMarker = booking?.place.marker
    ? ({
        ...booking.place.marker,
        position: booking.place.marker.position ?? undefined,
      } as MarkerResponse)
    : null
  const selectedMarker = bookedMarker ?? fallbackMarker

  const changeSchemeScale = (delta: number) => {
    setSchemeScale((current) => Math.max(0.5, Math.min(3, current + delta)))
  }

  const resetSchemeView = () => {
    setSchemeScale(1)
    setSchemePosition({ x: 0, y: 0 })
  }

  const handleSchemeWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    changeSchemeScale(event.deltaY > 0 ? -0.1 : 0.1)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      positionX: schemePosition.x,
      positionY: schemePosition.y,
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current
    if (!dragStart) return

    setSchemePosition({
      x: dragStart.positionX + event.clientX - dragStart.pointerX,
      y: dragStart.positionY + event.clientY - dragStart.pointerY,
    })
  }

  const handlePointerEnd = () => {
    dragStartRef.current = null
  }

  return (
    <>
      <Header officeName="Детали аренды" />
      <Box sx={{ display: "flex", height: "100vh", bgcolor: "#f5f7fb" }}>
        <CssBaseline />
        <NavBar onToggleOffices={() => undefined} />
        <Box
          component="main"
          sx={{
            ml: `${drawerWidth}px`,
            pt: "88px",
            px: 4,
            pb: 4,
            width: "100%",
            height: "100vh",
            overflowY: "auto",
          }}
        >
          <Stack spacing={3}>
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/bookings")}
              sx={{ alignSelf: "flex-start" }}
            >
              Назад к арендам
            </Button>

            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            )}

            {!loading && error && <Alert severity="error">{error}</Alert>}

            {!loading && booking && floor && (
              <>
                <Paper sx={{ p: 2.5, borderRadius: 1 }}>
                  <Stack spacing={1}>
                    <Typography variant="h5" fontWeight={700}>
                      {booking.place.officeName ?? "Офис"} ·{" "}
                      {booking.place.floorName}
                    </Typography>
                    <Typography color="text.secondary">
                      {booking.place.officeAddress ?? "Адрес не указан"}
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip label={`Маркер #${booking.markerId}`} />
                      <Chip label={booking.status} color="primary" />
                    </Stack>
                    <Typography>
                      Период: {formatDateTime(booking.startTime)} -{" "}
                      {formatDateTime(booking.endTime)}
                    </Typography>
                    <Typography fontWeight={700}>
                      Стоимость:{" "}
                      {Number(booking.totalPrice ?? 0).toLocaleString("ru-RU")}{" "}
                      ₽ ({Number(booking.pricePerHour ?? 0).toLocaleString(
                        "ru-RU",
                      )}{" "}
                      ₽/час)
                    </Typography>
                  </Stack>
                </Paper>

                <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
                  <Paper sx={{ p: 2, borderRadius: 1, flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                      sx={{ mb: 1.5 }}
                    >
                      <Typography fontWeight={700}>Схема этажа</Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Tooltip title="Уменьшить">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => changeSchemeScale(-0.15)}
                              disabled={schemeScale <= 0.5}
                            >
                              <ZoomOutIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Typography
                          variant="body2"
                          sx={{ minWidth: 48, textAlign: "center" }}
                        >
                          {Math.round(schemeScale * 100)}%
                        </Typography>
                        <Tooltip title="Увеличить">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => changeSchemeScale(0.15)}
                              disabled={schemeScale >= 3}
                            >
                              <ZoomInIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Сбросить вид">
                          <IconButton size="small" onClick={resetSchemeView}>
                            <CenterFocusStrongIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                    <Box
                      onWheel={handleSchemeWheel}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerEnd}
                      onPointerCancel={handlePointerEnd}
                      onPointerLeave={handlePointerEnd}
                      sx={{
                        position: "relative",
                        width: "100%",
                        height: "calc(100vh - 330px)",
                        minHeight: 420,
                        overflow: "hidden",
                        bgcolor: "#eef2f7",
                        borderRadius: 1,
                        touchAction: "none",
                        cursor: dragStartRef.current ? "grabbing" : "grab",
                        userSelect: "none",
                      }}
                    >
                      {floorImageUrl ? (
                        <Box
                          sx={{
                            position: "relative",
                            width: "100%",
                            transform: `translate(${schemePosition.x}px, ${schemePosition.y}px) scale(${schemeScale})`,
                            transformOrigin: "top left",
                            transition: dragStartRef.current
                              ? "none"
                              : "transform 120ms ease",
                          }}
                        >
                          <img
                            src={floorImageUrl}
                            alt={floor.name}
                            draggable={false}
                            onLoad={(event) =>
                              setImageSize({
                                width: event.currentTarget.naturalWidth,
                                height: event.currentTarget.naturalHeight,
                              })
                            }
                            style={{
                              width: "100%",
                              display: "block",
                              borderRadius: 8,
                            }}
                          />
                          {imageSize.width > 0 &&
                            allMarkers.map((marker) => {
                              const position = marker.position
                              if (!position) return null

                              const isBooked = marker.id === booking.markerId
                              return (
                                <Box
                                  key={marker.id}
                                  title={
                                    isBooked
                                      ? "Забронированный маркер"
                                      : `Маркер ${marker.id}`
                                  }
                                  sx={{
                                    position: "absolute",
                                    left: `${(position.position_x / imageSize.width) * 100}%`,
                                    top: `${(position.position_y / imageSize.height) * 100}%`,
                                    width: isBooked ? 42 : 18,
                                    height: isBooked ? 42 : 18,
                                    transform: "translate(-50%, -50%)",
                                    borderRadius: "50%",
                                    bgcolor: isBooked
                                      ? marker.type
                                        ? markerColor[marker.type]
                                        : "#3A7EFC"
                                      : "#b8c0cc",
                                    border: "4px solid white",
                                    opacity: isBooked ? 1 : 0.45,
                                    boxShadow: isBooked
                                      ? "0 0 0 10px rgba(47,128,237,0.22)"
                                      : "0 2px 8px rgba(0,0,0,0.16)",
                                    pointerEvents: "none",
                                  }}
                                />
                              )
                            })}
                        </Box>
                      ) : (
                        <Box sx={{ p: 4 }}>
                          <Alert severity="warning">
                            У этого этажа не загружена схема.
                          </Alert>
                        </Box>
                      )}
                    </Box>
                  </Paper>

                  <Stack spacing={2} sx={{ width: { xs: "100%", lg: 360 } }}>
                    <Paper sx={{ p: 2, borderRadius: 1 }}>
                      <Typography fontWeight={700} sx={{ mb: 1 }}>
                        Забронированный маркер
                      </Typography>
                      <Stack spacing={0.75}>
                        <Typography>
                          Название: {selectedMarker?.name ?? "Не указано"}
                        </Typography>
                        <Typography>
                          Тип:{" "}
                          {selectedMarker?.type
                            ? markerTypeLabel[selectedMarker.type] ??
                              selectedMarker.type
                            : "Не указан"}
                        </Typography>
                        <Typography>
                          Цена за час:{" "}
                          {Number(
                            booking.pricePerHour ??
                              selectedMarker?.pricePerHour ??
                              0,
                          ).toLocaleString("ru-RU")}{" "}
                          ₽
                        </Typography>
                        <Typography fontWeight={700}>
                          Итого:{" "}
                          {Number(booking.totalPrice ?? 0).toLocaleString(
                            "ru-RU",
                          )}{" "}
                          ₽
                        </Typography>
                      </Stack>
                    </Paper>

                    <MarkerGallery marker={selectedMarker} />
                  </Stack>
                </Stack>
              </>
            )}
          </Stack>
        </Box>
      </Box>
    </>
  )
}

function MarkerGallery({ marker }: { marker: MarkerResponse | null }) {
  const photos = marker?.photos?.length
    ? marker.photos.map((photo) => photo.url)
    : marker?.photoUrls ?? []

  return (
    <Paper sx={{ p: 2, borderRadius: 1 }}>
      <Typography fontWeight={700} sx={{ mb: 1 }}>
        Галерея маркера
      </Typography>
      {!marker && (
        <Typography color="text.secondary">
          Данные маркера не найдены на схеме.
        </Typography>
      )}
      {marker && photos.length === 0 && (
        <Typography color="text.secondary">
          Для этого маркера еще нет фотографий.
        </Typography>
      )}
      {photos.length > 0 && (
        <ImageList cols={2} gap={8}>
          {photos.map((url) => (
            <ImageListItem key={url}>
              <img
                src={getImageUrl(url)}
                alt={marker?.name ?? `Маркер ${marker?.id}`}
                loading="lazy"
                style={{ borderRadius: 6, objectFit: "cover" }}
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Paper>
  )
}
