import { useState, useEffect } from "react";
import { Slider, Typography, Box, Stack } from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {ru} from 'date-fns/locale/ru';

type CustomTimeRangeProps = {
  startTime: string;
  endTime: string;
  onStartChange: (time: string) => void;
  onEndChange: (time: string) => void;
};

export default function CustomTimeRange({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
}: CustomTimeRangeProps) {
  // Конвертируем строки в минуты с начала дня
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const startMinutes = timeToMinutes(startTime || "08:00");
  const endMinutes = timeToMinutes(endTime || "20:00");

  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      onStartChange(minutesToTime(newValue[0]));
      onEndChange(minutesToTime(newValue[1]));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Box sx={{ mt: 3, px: 1 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Выберите свой интервал
        </Typography>

        {/* Визуальная шкала с ползунками */}
        <Box sx={{ px: 2, mb: 1 }}>
          <Slider
            value={[startMinutes, endMinutes]}
            onChange={handleSliderChange}
            min={8 * 60}      // 08:00
            max={22 * 60}     // 22:00
            step={15}         // шаг 15 минут
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => minutesToTime(value)}
            sx={{ color: "#3b82f6" }}
          />
        </Box>

        {/* Точные пикеры времени */}
        <Stack direction="row" spacing={2}>
          <TimePicker
            label="Начало"
            value={new Date(`2026-01-01T${startTime}`)}
            onChange={(newValue) => {
              if (newValue) onStartChange(newValue.toTimeString().slice(0, 5));
            }}
            sx={{ flex: 1 }}
          />
          <TimePicker
            label="Конец"
            value={new Date(`2026-01-01T${endTime}`)}
            onChange={(newValue) => {
              if (newValue) onEndChange(newValue.toTimeString().slice(0, 5));
            }}
            sx={{ flex: 1 }}
          />
        </Stack>
      </Box>
    </LocalizationProvider>
  );
}