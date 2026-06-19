import Header from "@entities/Header/Header"
import NavBar from "@entities/NavBar/NavBar"
import { drawerWidth } from "@features/OfficesBar/config/config"
import EventSeatIcon from "@mui/icons-material/EventSeat"
import OpenInNewIcon from "@mui/icons-material/OpenInNew"
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import { getMyBookings, type Booking } from "@shared/api/Bookings"
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const PAGE_SIZE = 20

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

export default function MyBookingsPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")

  const loadBookings = useCallback(async (cursor: number | null = null) => {
    cursor ? setLoadingMore(true) : setLoading(true)
    setError("")

    try {
      const data = await getMyBookings({ cursor, size: PAGE_SIZE })
      setBookings((prev) => (cursor ? [...prev, ...data.items] : data.items))
      setNextCursor(data.nextCursor)
      setHasMore(data.hasMore)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось загрузить аренды",
      )
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    void loadBookings()
  }, [loadBookings])

  return (
    <>
      <Header officeName="Мои аренды" />
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
          <Stack spacing={3} sx={{ maxWidth: 980 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <EventSeatIcon color="primary" />
              <Typography variant="h4" fontWeight={700}>
                Мои аренды
              </Typography>
            </Stack>

            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            )}

            {!loading && error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && bookings.length === 0 && (
              <Paper sx={{ p: 4, borderRadius: 1 }}>
                <Typography color="text.secondary">
                  У вас пока нет аренд.
                </Typography>
              </Paper>
            )}

            {!loading &&
              !error &&
              bookings.map((booking) => (
                <Paper key={booking.id} sx={{ p: 2.5, borderRadius: 1 }}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="h6">
                        {booking.place.officeName ?? "Офис"} ·{" "}
                        {booking.place.floorName}
                      </Typography>
                      <Typography color="text.secondary">
                        Маркер №{booking.markerId}
                        {booking.place.marker.name
                          ? `, ${booking.place.marker.name}`
                          : ""}
                      </Typography>
                      <Typography variant="body2">
                        {formatDateTime(booking.startTime)} -{" "}
                        {formatDateTime(booking.endTime)}
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        Стоимость:{" "}
                        {Number(booking.totalPrice ?? 0).toLocaleString(
                          "ru-RU",
                        )}{" "}
                        ₽
                      </Typography>
                    </Stack>
                    <Button
                      variant="contained"
                      startIcon={<OpenInNewIcon />}
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      Открыть
                    </Button>
                  </Stack>
                </Paper>
              ))}

            {!loading && !error && hasMore && (
              <Button
                variant="outlined"
                disabled={loadingMore}
                onClick={() => void loadBookings(nextCursor)}
                sx={{ alignSelf: "center" }}
              >
                {loadingMore ? "Загрузка..." : "Показать еще"}
              </Button>
            )}
          </Stack>
        </Box>
      </Box>
    </>
  )
}
