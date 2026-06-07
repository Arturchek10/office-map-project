import {
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  Typography,
  DialogActions,
  Button,
  Alert,
  Fade,
  Chip,
  Divider,
  ImageList,
  ImageListItem,
} from "@mui/material";

import type { MarkerResponse } from "../../shared/types/marker";
import { useEffect, useMemo, useState } from "react";
import TimeIntervalButton from "../../shared/components/TimeIntervalButton";
import DateSelector from "@shared/components/DateSelector";
import CustomTimeRange from "../../shared/components/CustomTimeRange";
import {
  createBooking,
  getMarkerBusyIntervals,
  type BusyInterval,
} from "@shared/api/Bookings";
import { getImageUrl } from "@shared/utils/getImageUrl";

type BookingMarkerFormProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedMarker: MarkerResponse | null;
  onBookingCreated: () => void;
};

export type Interval = {
  id: string;
  label: string;
  time: string;
};

export default function BookingMarkerForm({
  isOpen,
  onClose,
  selectedMarker,
  onBookingCreated,
}: BookingMarkerFormProps) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("8:00");
  const [endTime, setEndTime] = useState("22:00");

  const [errorMessage, setErrorMessage] = useState("");
  const [busyIntervals, setBusyIntervals] = useState<BusyInterval[]>([]);
  const [loadingBusy, setLoadingBusy] = useState(false);

  const [intervals] = useState<Interval[]>([
    { id: "morning", label: "Утро", time: "8:00-12:00" },
    { id: "day", label: "День", time: "12:00-17:00" },
    { id: "evening", label: "Вечер", time: "17:00-20:00" },
    { id: "fullDay", label: "Полный день", time: "8:00-20:00" },
  ]);

  const [selectedInterval, setSelectedInterval] = useState<string>("");

  const intervalById = useMemo(
    () => new Map(intervals.map((interval) => [interval.id, interval])),
    [intervals],
  );

  const markerPhotos = selectedMarker?.photos?.length
    ? selectedMarker.photos.map((photo) => photo.url)
    : selectedMarker?.photoUrls ?? [];

  useEffect(() => {
    if (!isOpen || !selectedMarker?.id || !date) {
      setBusyIntervals([]);
      return;
    }

    setLoadingBusy(true);
    getMarkerBusyIntervals(selectedMarker.id, date)
      .then(setBusyIntervals)
      .catch((error) => {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить занятость места",
        );
      })
      .finally(() => setLoadingBusy(false));
  }, [date, isOpen, selectedMarker?.id]);

  const handleIntervalSelect = (id: string) => {
    setSelectedInterval(id);

    const interval = intervalById.get(id);
    if (!interval) return;

    const [start, end] = interval.time.split("-");
    setStartTime(start.padStart(5, "0"));
    setEndTime(end.padStart(5, "0"));
  };

  const handleSubmit = async () => {
    console.log("отправка брони на бэк");
    setErrorMessage("");

    // если маркер не выбран  - ничего не отправляем
    if (!selectedMarker) return;

    if (!date || !startTime || !endTime) {
      alert("Выбери дату, время начала и время конца");
      return;
    }
    // формат для backend: 2026-05-03T10:00:00
    const startDateTime = `${date}T${startTime}:00`;
    const endDateTime = `${date}T${endTime}:00`;

    try {
      await createBooking({
        markerId: selectedMarker.id,
        startTime: startDateTime,
        endTime: endDateTime,
      });

      // обновить карту / брони после создания
      onBookingCreated?.();
      onClose();
    } catch (e) {
      if (e instanceof Error) {
        setErrorMessage(e.message);
      } else {
        setErrorMessage("Ошибка бронирования");
      }
      console.error(e);
    }
  };

  const handleClose = async () => {
    setErrorMessage("");
    onClose();
  };
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          style: { padding: 15, borderRadius: "30px", minWidth: "630px", maxHeight: "79vh"},
        },
      }}
    >
      {errorMessage && (
        <Fade timeout={300} in={!!errorMessage}>
          <Alert severity="error">{errorMessage}</Alert>
        </Fade>
      )}

      <DialogTitle sx={{ textAlign: "center", pb: 2 }}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 0.5 }}>
          Бронирование рабочего места
        </Typography>
        <Typography variant="h3" fontWeight={700} color="primary.main">
          № {selectedMarker?.id}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0 }}>
          <p className="text-xl font-semibold mt-1">
            Место: {selectedMarker?.id}
          </p>
          <Typography variant="body1" fontWeight={700}>
            Цена за час: {Number(selectedMarker?.pricePerHour ?? 0).toLocaleString("ru-RU")} ₽
          </Typography>
          {/* даты будут в квадратных капсулах по дням недели. на 7 дней вперед. то есть первый это сегодня
          например вторник то будет вт ср чт пт сб пн вт первые два будут выделены более синим, потом можно будет
          добавить индикатор огонька если на эту дату очень много людей забронировали */}

          <DateSelector onSelect={setDate} selectedDate={date} />

          {/* вместо инпута сделать формочки с временными промежутками. Хотя как понять какой интервал ставить
          просто красивее будет если будут уже капсуки и внутри отрезок времени и просто можно будет кликнуть 
          пока ввод начала времени  и конца кажется сырым 
          */}
          <div>
            <TimeIntervalButton
              intervals={intervals}
              selectedId={selectedInterval}
              onSelect={handleIntervalSelect}
            />

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary">
              {date
                ? "Занято в выбранный день"
                : "Выберите день, чтобы увидеть занятость"}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {loadingBusy && <Chip label="Загружаем..." />}
              {!loadingBusy && date && busyIntervals.length === 0 && (
                <Chip color="success" label="Свободно весь день" />
              )}
              {!loadingBusy &&
                busyIntervals.map((booking) => (
                  <Chip
                    key={booking.id}
                    color="warning"
                    label={`${new Date(booking.startTime).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} - ${new Date(booking.endTime).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
                  />
                ))}
            </Stack>

            {markerPhotos.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Фото маркера
                </Typography>
                <ImageList cols={3} gap={8}>
                  {markerPhotos.map((url) => (
                    <ImageListItem key={url}>
                      <img
                        src={getImageUrl(url)}
                        alt={`Место ${selectedMarker?.id}`}
                        loading="lazy"
                        style={{
                          borderRadius: 6,
                          height: 110,
                          objectFit: "cover",
                        }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </>
            )}

            {selectedInterval === "custom" && (
              <CustomTimeRange
                startTime={startTime}
                endTime={endTime}
                onStartChange={setStartTime}
                onEndChange={setEndTime}
              />
            )}
          </div>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Отмена</Button>

        <Button variant="contained" onClick={handleSubmit}>
          Забронировать
        </Button>
      </DialogActions>
    </Dialog>
  );
}
