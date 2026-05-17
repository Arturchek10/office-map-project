import {
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  Typography,
  TextField,
  DialogActions,
  Button,
  Alert,
  Fade,
} from "@mui/material";

import type { MarkerResponse } from "../../shared/types/marker";
import { useState } from "react";
import TimeIntervalButton from "../../shared/components/TimeIntervalButton";
import DateSelector from "@shared/components/DateSelector";
import CustomTimeRange from "../../shared/components/CustomTimeRange";

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

  const [intervals, setIntervals] = useState<Interval[]>([
    { id: "morning", label: "Утро", time: "8:00-12:00" },
    { id: "day", label: "День", time: "12:00-17:00" },
    { id: "evening", label: "Вечер", time: "17:00-20:00" },
    { id: "fullDay", label: "Полный день", time: "8:00-20:00" },
  ]);

  const [selectedInterval, setSelectedInterval] = useState<string>("");

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
      const response = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markerId: selectedMarker.id,
          startTime: startDateTime,
          endTime: endDateTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка бронирования");
      }

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
              onSelect={setSelectedInterval}
            />

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
