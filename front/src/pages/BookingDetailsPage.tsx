import Header from "@entities/Header/Header";
import NavBar from "@entities/NavBar/NavBar";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  CssBaseline,
  ImageList,
  ImageListItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { drawerWidth } from "@features/OfficesBar/config/config";
import {
  createBulkBooking,
  getAvailableMarkersByFloor,
  getBookingById,
  type Booking,
} from "@shared/api/Bookings";
import { getFloorById } from "@shared/api/Floors/GetFloorById";
import type { ResponseCreateFloor } from "@shared/types/floor";
import type { MarkerResponse } from "@shared/types/marker";
import { markerColor } from "@shared/types/marker";
import { getImageUrl } from "@shared/utils/getImageUrl";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const toDateInput = (value: string) => value.slice(0, 10);
const toTimeInput = (value: string) => value.slice(11, 16);

export default function BookingDetailsPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [floor, setFloor] = useState<ResponseCreateFloor | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [bookingBulk, setBookingBulk] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [availableMarkers, setAvailableMarkers] = useState<MarkerResponse[] | null>(null);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [focusedMarker, setFocusedMarker] = useState<MarkerResponse | null>(null);

  useEffect(() => {
    const id = Number(bookingId);
    if (!Number.isFinite(id)) {
      setError("Некорректный номер аренды");
      setLoading(false);
      return;
    }

    getBookingById(id)
      .then(async (nextBooking) => {
        setBooking(nextBooking);
        setDate(toDateInput(nextBooking.startTime));
        setStartTime(toTimeInput(nextBooking.startTime));
        setEndTime(toTimeInput(nextBooking.endTime));
        setFloor(await getFloorById(nextBooking.place.floorId));
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Не удалось загрузить аренду"),
      )
      .finally(() => setLoading(false));
  }, [bookingId]);

  const allMarkers = useMemo(
    () => floor?.baseLayer.markers.filter((marker) => marker.type === "workspace" || marker.type === "room") ?? [],
    [floor],
  );
  const visibleMarkers = availabilityChecked ? availableMarkers ?? [] : allMarkers;
  const floorImageUrl = getImageUrl(floor?.photoUrl);
  const startDateTime = date && startTime ? `${date}T${startTime}:00` : "";
  const endDateTime = date && endTime ? `${date}T${endTime}:00` : "";
  const selectedHours = useMemo(() => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const hours = (end.getTime() - start.getTime()) / (60 * 60 * 1000);
    return Number.isFinite(hours) && hours > 0 ? hours : 0;
  }, [endDateTime, startDateTime]);
  const selectedTotal = visibleMarkers
    .filter((marker) => selectedIds.includes(marker.id))
    .reduce((sum, marker) => sum + Number(marker.pricePerHour ?? 0) * selectedHours, 0);

  const resetAvailability = () => {
    setAvailabilityChecked(false);
    setAvailableMarkers(null);
    setSelectedIds([]);
    setFocusedMarker(null);
    setSuccess("");
  };

  const checkAvailable = async () => {
    resetAvailability();
    if (!floor || !startDateTime || !endDateTime) {
      setError("Укажите дату, время начала и время конца");
      return;
    }

    if (selectedHours <= 0) {
      setError("Время окончания должно быть позже времени начала");
      return;
    }

    setChecking(true);
    setError("");
    setSuccess("");
    try {
      const markers = await getAvailableMarkersByFloor(floor.id, startDateTime, endDateTime);
      setAvailableMarkers(markers);
      setAvailabilityChecked(true);
      setSelectedIds([]);
      setFocusedMarker(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось проверить доступность");
    } finally {
      setChecking(false);
    }
  };

  const toggleMarker = (marker: MarkerResponse) => {
    setFocusedMarker(marker);
    if (!availabilityChecked) return;
    setSelectedIds((prev) =>
      prev.includes(marker.id)
        ? prev.filter((id) => id !== marker.id)
        : [...prev, marker.id],
    );
  };

  const createTeamBooking = async () => {
    if (!startDateTime || !endDateTime || selectedIds.length === 0 || selectedHours <= 0) return;

    setBookingBulk(true);
    setError("");
    setSuccess("");
    try {
      await createBulkBooking({
        markerIds: selectedIds,
        startTime: startDateTime,
        endTime: endDateTime,
      });
      setSuccess(`Создано броней: ${selectedIds.length}`);
      await checkAvailable();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать массовую аренду");
    } finally {
      setBookingBulk(false);
    }
  };

  return (
    <>
      <Header officeName="Детали аренды" />
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f7fb" }}>
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
            {success && <Alert severity="success">{success}</Alert>}

            {!loading && booking && floor && (
              <>
                <Paper sx={{ p: 2.5, borderRadius: 1 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="h5" fontWeight={700}>
                      {booking.place.officeName ?? "Офис"} · {booking.place.floorName}
                    </Typography>
                    <Typography color="text.secondary">
                      {booking.place.officeAddress ?? "Адрес не указан"}
                    </Typography>
                    <Typography>
                      Текущая аренда: место #{booking.markerId}, {formatDateTime(booking.startTime)} -{" "}
                      {formatDateTime(booking.endTime)}
                    </Typography>
                    <Typography fontWeight={700}>
                      Стоимость: {Number(booking.totalPrice ?? 0).toLocaleString("ru-RU")} ₽{" "}
                      ({Number(booking.pricePerHour ?? 0).toLocaleString("ru-RU")} ₽/час)
                    </Typography>
                  </Stack>
                </Paper>

                <Paper sx={{ p: 2, borderRadius: 1 }}>
                  <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                        <TextField
                          label="Дата"
                          type="date"
                          value={date}
                          onChange={(event) => {
                            setDate(event.target.value);
                            resetAvailability();
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          label="С"
                          type="time"
                          value={startTime}
                          onChange={(event) => {
                            setStartTime(event.target.value);
                            resetAvailability();
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          label="До"
                          type="time"
                          value={endTime}
                          onChange={(event) => {
                            setEndTime(event.target.value);
                            resetAvailability();
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                        <Button variant="contained" onClick={checkAvailable} disabled={checking}>
                          Проверить свободные точки
                        </Button>
                      </Stack>

                      <Box
                        sx={{
                          position: "relative",
                          width: "100%",
                          maxHeight: "calc(100vh - 340px)",
                          overflow: "auto",
                          bgcolor: "#eef2f7",
                          borderRadius: 1,
                        }}
                      >
                        {floorImageUrl ? (
                          <Box sx={{ position: "relative", display: "inline-block", minWidth: "100%" }}>
                            <img
                              src={floorImageUrl}
                              alt={floor.name}
                              onLoad={(event) =>
                                setImageSize({
                                  width: event.currentTarget.naturalWidth,
                                  height: event.currentTarget.naturalHeight,
                                })
                              }
                              style={{ width: "100%", display: "block", borderRadius: 8 }}
                            />
                            {imageSize.width > 0 &&
                              visibleMarkers.map((marker) => {
                                const position = marker.position;
                                if (!position) return null;

                                const isCurrent = marker.id === booking.markerId;
                                const isSelected = selectedIds.includes(marker.id);
                                const isFocused = focusedMarker?.id === marker.id;

                                return (
                                  <Box
                                    key={marker.id}
                                    title={`Точка ${marker.id}`}
                                    onClick={() => toggleMarker(marker)}
                                    sx={{
                                      position: "absolute",
                                      left: `${(position.position_x / imageSize.width) * 100}%`,
                                      top: `${(position.position_y / imageSize.height) * 100}%`,
                                      width: isCurrent || isSelected || isFocused ? 36 : 22,
                                      height: isCurrent || isSelected || isFocused ? 36 : 22,
                                      transform: "translate(-50%, -50%)",
                                      borderRadius: "50%",
                                      bgcolor: isSelected
                                        ? "#ff9800"
                                        : marker.type
                                          ? markerColor[marker.type]
                                          : "#3A7EFC",
                                      border: "4px solid white",
                                      boxShadow:
                                        isCurrent || isSelected || isFocused
                                          ? "0 0 0 8px rgba(47,128,237,0.25)"
                                          : "0 2px 10px rgba(0,0,0,0.22)",
                                      cursor: availableMarkers ? "pointer" : "default",
                                    }}
                                  />
                                );
                              })}
                          </Box>
                        ) : (
                          <Box sx={{ p: 4 }}>
                            <Alert severity="warning">У этажа не загружена схема.</Alert>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    <Stack spacing={2} sx={{ width: { xs: "100%", lg: 360 } }}>
                      <Box sx={{ p: 2, borderRadius: 1, border: "1px solid #dde3ee" }}>
                        <Typography fontWeight={700} sx={{ mb: 1 }}>
                          Массовая аренда
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 1 }}>
                          После проверки на схеме останутся только свободные точки для выбранного времени.
                        </Typography>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          <Chip label={`Свободно: ${availableMarkers?.length ?? "не проверено"}`} />
                          <Chip color="warning" label={`Выбрано: ${selectedIds.length}`} />
                        </Stack>
                        <Typography fontWeight={700} sx={{ mt: 1 }}>
                          Итого: {selectedTotal.toLocaleString("ru-RU", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })} ₽
                        </Typography>
                        <Button
                          fullWidth
                          variant="contained"
                          sx={{ mt: 2 }}
                          disabled={bookingBulk || selectedIds.length === 0}
                          onClick={createTeamBooking}
                        >
                          Забронировать выбранные
                        </Button>
                      </Box>

                      <MarkerGallery marker={focusedMarker} />
                    </Stack>
                  </Stack>
                </Paper>
              </>
            )}
          </Stack>
        </Box>
      </Box>
    </>
  );
}

function MarkerGallery({ marker }: { marker: MarkerResponse | null }) {
  const photos = marker?.photos?.length
    ? marker.photos.map((photo) => photo.url)
    : marker?.photoUrls ?? [];

  return (
    <Box sx={{ p: 2, borderRadius: 1, border: "1px solid #dde3ee" }}>
      <Typography fontWeight={700} sx={{ mb: 1 }}>
        Галерея точки
      </Typography>
      {!marker && <Typography color="text.secondary">Выберите точку на схеме.</Typography>}
      {marker && photos.length === 0 && (
        <Typography color="text.secondary">Для этой точки ещё нет фотографий.</Typography>
      )}
      {photos.length > 0 && (
        <ImageList cols={2} gap={8}>
          {photos.map((url) => (
            <ImageListItem key={url}>
              <img
                src={getImageUrl(url)}
                alt={marker?.name ?? `Точка ${marker?.id}`}
                loading="lazy"
                style={{ borderRadius: 6, objectFit: "cover" }}
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Box>
  );
}
