import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import LayersIcon from "@mui/icons-material/Layers";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { useNavigate } from "react-router-dom";
import { $activeOffice } from "@shared/api/Offices/GetOfficeById";
import { useUnit } from "effector-react";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import {
  $activeOfficeLoading,
  fetchOfficeByIdFx,
} from "@shared/api/Offices/GetOfficeById";
import { fetchOfficesFx } from "@shared/api/Offices/GetOfficesList";
import { updateOfficeFx } from "@shared/api/Offices/AddOffice";
import { TOffice } from "@entities/Office/type/office";
import { getImageUrl } from "@shared/utils/getImageUrl";
import { $user } from "@shared/store/auth";
import { getOfficeBookingsByAdmin } from "@shared/api/Admin";
import type { Booking } from "@shared/api/Bookings";

interface OfficeInfoBarProps {
  open: boolean;
  activeOfficeId: number | null;
  activeOffice: TOffice | null;
  openEditByDefault?: boolean;
  onClose: () => void;
}

export default function OfficeInfoBar({
  open,
  activeOfficeId,
  activeOffice,
  openEditByDefault = false,
  onClose,
}: OfficeInfoBarProps) {
  const navigate = useNavigate();
  const office = useUnit($activeOffice);
  const loading = useUnit($activeOfficeLoading);
  const user = useUnit($user);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [reportTab, setReportTab] = useState<"info" | "reports">("info");
  const [reports, setReports] = useState<Booking[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");

  const currentOffice = office?.id === activeOfficeId ? office : null;
  const photoUrl = getImageUrl(activeOffice?.photoUrl);
  const floors = currentOffice?.floors ?? [];
  const canEdit =
    user?.role === "ADMIN" &&
    activeOffice?.createdByUserId != null &&
    Number(activeOffice.createdByUserId) === Number(user.id);

  useEffect(() => {
    if (!open || !activeOfficeId) return;
    fetchOfficeByIdFx(activeOfficeId);
  }, [open, activeOfficeId]);

  useEffect(() => {
    if (!open || !activeOfficeId || !canEdit) {
      setReports([]);
      setReportsError("");
      return;
    }

    let isCancelled = false;
    const loadReports = async () => {
      setReportsLoading(true);
      setReportsError("");
      try {
        const data = await getOfficeBookingsByAdmin(activeOfficeId);
        if (!isCancelled) {
          setReports(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setReportsError(error instanceof Error ? error.message : "Не удалось загрузить отчёты");
        }
      } finally {
        if (!isCancelled) {
          setReportsLoading(false);
        }
      }
    };

    void loadReports();
    return () => {
      isCancelled = true;
    };
  }, [open, activeOfficeId, canEdit]);

  useEffect(() => {
    setEditOpen(openEditByDefault);
    setEditName(activeOffice?.name ?? "");
    setEditAddress(activeOffice?.address ?? "");
    setEditPhoto(null);
    setRemovePhoto(false);
    setSaveError("");
  }, [
    activeOffice?.id,
    activeOffice?.name,
    activeOffice?.address,
    open,
    openEditByDefault,
  ]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 2,
    }).format(value);

  const buildReport = (bookings: Booking[]) => {
    const placeMap = new Map<string, { label: string; floor: string; count: number; revenue: number }>();
    const floorMap = new Map<string, { floor: string; count: number; revenue: number; markers: Set<string> }>();
    let totalRevenue = 0;

    bookings.forEach((booking) => {
      const start = new Date(booking.startTime).getTime();
      const end = new Date(booking.endTime).getTime();
      const durationHours = (end - start) / (1000 * 60 * 60);
      const totalPrice = Number(booking.totalPrice ?? 0);
      const pricePerHour = Number(
        booking.pricePerHour ?? booking.place.marker.pricePerHour ?? 0,
      );
      const fallbackPrice = pricePerHour * Math.max(0, durationHours);
      const revenue = totalPrice || fallbackPrice;
      totalRevenue += revenue;

      const placeLabel = booking.place.marker.name || `Место #${booking.markerId}`;
      const floorLabel = `${booking.place.floorName} (этаж ${booking.place.floorOrderNumber})`;
      const placeKey = `${booking.place.floorId}:${booking.markerId}`;
      const placeEntry = placeMap.get(placeKey) ?? { label: placeLabel, floor: floorLabel, count: 0, revenue: 0 };
      placeEntry.count += 1;
      placeEntry.revenue += revenue;
      placeMap.set(placeKey, placeEntry);

      const floorKey = String(booking.place.floorId);
      const floorEntry = floorMap.get(floorKey) ?? { floor: floorLabel, count: 0, revenue: 0, markers: new Set<string>() };
      floorEntry.count += 1;
      floorEntry.revenue += revenue;
      floorEntry.markers.add(placeLabel);
      floorMap.set(floorKey, floorEntry);
    });

    return {
      totalBookings: bookings.length,
      totalRevenue,
      uniquePlaces: placeMap.size,
      uniqueFloors: floorMap.size,
      placeRows: Array.from(placeMap.values()).sort((a, b) => b.count - a.count),
      floorRows: Array.from(floorMap.values()).sort((a, b) => b.count - a.count),
    };
  };

  const report = buildReport(reports);

  const handleCreateFloor = () => {
    if (!activeOfficeId) return;
    onClose();
    navigate(`/office/${activeOfficeId}/createfloor`);
  };

  const handleOpenFloor = (floorId: number) => {
    if (!activeOfficeId) return;
    onClose();
    navigate(`/office/${activeOfficeId}/floor/${floorId}`);
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setEditPhoto(file);
    if (file) {
      setRemovePhoto(false);
    }
  };

  const handleSaveOffice = async () => {
    if (!activeOfficeId || !editName.trim() || !editAddress.trim()) {
      setSaveError("Заполните название и адрес офиса.");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({
          name: editName.trim(),
          address: editAddress.trim(),
          removePhoto: editPhoto ? false : removePhoto,
        }),
      );

      if (editPhoto) {
        formData.append("photo", editPhoto);
      }

      await updateOfficeFx({ officeId: activeOfficeId, formData });
      await Promise.all([fetchOfficesFx(), fetchOfficeByIdFx(activeOfficeId)]);
      setEditOpen(false);
      setEditPhoto(null);
      setRemovePhoto(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Не удалось сохранить офис.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{activeOffice?.name ?? "Офис"}</DialogTitle>
      <DialogContent dividers>
        {canEdit && (
          <Box sx={{ mb: 2 }}>
            <Tabs value={reportTab} onChange={(_, value: "info" | "reports") => setReportTab(value)}>
              <Tab value="info" label="Информация" />
              <Tab value="reports" label="Отчёты" />
            </Tabs>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <Stack spacing={2.5}>
            {canEdit && reportTab === "reports" ? (
              <Stack spacing={2}>
                {reportsLoading && <CircularProgress />}
                {reportsError && <Alert severity="error">{reportsError}</Alert>}
                {!reportsLoading && !reportsError && (
                  <>
                    <Paper sx={{ p: 2, borderRadius: 1, bgcolor: "grey.50" }}>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        Отчёты по офису
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip label={`Бронирований: ${report.totalBookings}`} color="primary" />
                        <Chip label={`Мест: ${report.uniquePlaces}`} color="info" />
                        <Chip label={`Этажей: ${report.uniqueFloors}`} color="secondary" />
                        <Chip label={`Выручка: ${formatCurrency(report.totalRevenue)}`} color="success" />
                      </Stack>
                    </Paper>

                    <Stack spacing={1}>
                      {report.placeRows.map((item) => (
                        <Paper key={`${item.floor}-${item.label}`} sx={{ p: 2, borderRadius: 1 }}>
                          <Stack direction="row" justifyContent="space-between" gap={2} flexWrap="wrap">
                            <Box>
                              <Typography fontWeight={700}>{item.label}</Typography>
                              <Typography color="text.secondary">{item.floor}</Typography>
                            </Box>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              <Chip label={`Бронирований: ${item.count}`} color="primary" />
                              <Chip label={`Выручка: ${formatCurrency(item.revenue)}`} color="success" />
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </>
                )}
              </Stack>
            ) : (
              <>
                <Box
                  sx={{
                    width: "100%",
                    height: 260,
                    overflow: "hidden",
                    borderRadius: 1,
                    bgcolor: "#f5f7fa",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {photoUrl && !removePhoto ? (
                    <img
                      src={photoUrl}
                      alt={activeOffice?.name ?? "office"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "text.secondary",
                      }}
                    >
                      Фото офиса не загружено
                    </Box>
                  )}
                </Box>

                <Stack spacing={0.5}>
                  <Typography variant="body1">
                    {activeOffice?.city}, {activeOffice?.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Координаты: {activeOffice?.latitude}, {activeOffice?.longitude}
                  </Typography>
                </Stack>

                {canEdit && editOpen && (
                  <Box
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 2,
                    }}
                  >
                    <Stack spacing={2}>
                      <TextField
                        label="Название офиса"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="Адрес"
                        value={editAddress}
                        onChange={(event) => setEditAddress(event.target.value)}
                        fullWidth
                      />
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={<PhotoCameraIcon />}
                        >
                          {editPhoto ? editPhoto.name : "Заменить превью"}
                          <input
                            hidden
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handlePhotoChange}
                          />
                        </Button>
                        {photoUrl && (
                          <Button
                            variant={removePhoto ? "contained" : "outlined"}
                            color="error"
                            onClick={() => {
                              setRemovePhoto((value) => !value);
                              setEditPhoto(null);
                            }}
                          >
                            {removePhoto ? "Фото будет удалено" : "Удалить фото"}
                          </Button>
                        )}
                      </Stack>
                      {saveError && <Alert severity="error">{saveError}</Alert>}
                    </Stack>
                  </Box>
                )}

                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <LayersIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2">Этажи: {floors.length}</Typography>
                  </Stack>

                  {floors.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {canEdit
                        ? "У офиса пока нет этажей. Создайте первый этаж, затем загрузите план и расставьте маркеры."
                        : "У офиса пока нет доступных этажей."}
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {floors.map((floor) => (
                        <Button
                          key={floor.id}
                          variant="outlined"
                          startIcon={<OpenInNewIcon />}
                          onClick={() => handleOpenFloor(floor.id)}
                          sx={{ justifyContent: "flex-start" }}
                        >
                          {floor.name} · этаж {floor.orderNumber}
                        </Button>
                      ))}
                    </Stack>
                  )}
                </Box>
              </>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Закрыть</Button>
        {canEdit && (
          <>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditOpen((value) => !value)}
            >
              {editOpen ? "Скрыть редактирование" : "Редактировать офис"}
            </Button>
            {editOpen && (
              <Button
                variant="contained"
                onClick={() => void handleSaveOffice()}
                disabled={saving}
              >
                Сохранить офис
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateFloor}
            >
              {floors.length === 0 ? "Создать первый этаж" : "Добавить этаж"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
