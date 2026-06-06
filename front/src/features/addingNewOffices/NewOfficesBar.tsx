import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import PlaceIcon from "@mui/icons-material/Place";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Map as YandexMap, Placemark, useYMaps } from "@pbe/react-yandex-maps";
import { useState } from "react";
import { useUnit } from "effector-react";
import { $user } from "@shared/store/auth";
import {
  buildAddressQuery,
  resolveYandexCoordinates,
  type YMapsGeocoderApi,
  type YandexCoordinates,
} from "@shared/utils/yandexGeocode";

interface NewOfficesBarProps {
  onAddOffice: (formData: FormData) => Promise<void>;
  open: boolean;
  setOpen: (open: boolean) => void;
}

type YandexMapClickEvent = {
  get: (key: string) => unknown;
};

const DEFAULT_CENTER: YandexCoordinates = [55.751244, 37.618423];

function NewOfficesBar({ onAddOffice, open, setOpen }: NewOfficesBarProps) {
  const user = useUnit($user);
  const canEdit = user?.role === "ADMIN";
  const ymapsApi = useYMaps(["geocode"]) as YMapsGeocoderApi | null;

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    photo: null as File | null,
  });
  const [point, setPoint] = useState<YandexCoordinates | null>(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      photo: null,
    });
    setPoint(null);
    setFormError("");
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setOpen(false);
    setFormError("");
  };

  const handleInputChange =
    (field: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (field === "photo") {
        const file = event.target.files?.[0] ?? null;
        setFormData((prev) => ({ ...prev, photo: file }));
        return;
      }

      if (formError) setFormError("");
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleMapClick = (event: YandexMapClickEvent) => {
    const coords = event.get("coords");
    if (!Array.isArray(coords) || coords.length < 2) return;

    const latitude = Number(coords[0]);
    const longitude = Number(coords[1]);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    setPoint([latitude, longitude]);
    setFormError("");
  };

  const handleFindAddress = async () => {
    const query = buildAddressQuery(formData.city, formData.address);
    if (!query) {
      setFormError("Заполните город и адрес, либо поставьте точку на карте.");
      return;
    }

    setIsResolvingAddress(true);
    setFormError("");

    const coords = await resolveYandexCoordinates(ymapsApi, query);
    setIsResolvingAddress(false);

    if (!coords) {
      setFormError("Не удалось найти адрес. Поставьте точку на карте вручную.");
      return;
    }

    setPoint(coords);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim()) {
      setFormError("Заполните название, город и адрес.");
      return;
    }

    let officePoint = point;
    if (!officePoint) {
      const query = buildAddressQuery(formData.city, formData.address);
      officePoint = await resolveYandexCoordinates(ymapsApi, query);
    }

    if (!officePoint) {
      setFormError("Поставьте точку офиса на карте.");
      return;
    }

    const officeData = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      latitude: officePoint[0],
      longitude: officePoint[1],
    };

    const data = new FormData();
    data.append("data", JSON.stringify(officeData));
    if (formData.photo) {
      data.append("photo", formData.photo);
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await onAddOffice(data);
      resetForm();
      setOpen(false);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Не удалось создать офис.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canEdit) return null;

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddLocationAltIcon />}
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          top: 80,
          right: 32,
          zIndex: 1200,
          boxShadow: 2,
        }}
      >
        Новый офис
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle>Создать офис</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Название офиса"
                value={formData.name}
                onChange={handleInputChange("name")}
                disabled={isSubmitting}
                required
              />
              <TextField
                fullWidth
                label="Город"
                value={formData.city}
                onChange={handleInputChange("city")}
                disabled={isSubmitting}
                required
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Адрес"
                value={formData.address}
                onChange={handleInputChange("address")}
                disabled={isSubmitting}
                required
              />
              <Button
                variant="outlined"
                startIcon={
                  isResolvingAddress ? (
                    <CircularProgress size={18} />
                  ) : (
                    <SearchIcon />
                  )
                }
                onClick={handleFindAddress}
                disabled={isSubmitting || isResolvingAddress}
                sx={{ minWidth: 180 }}
              >
                Найти
              </Button>
            </Stack>

            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <PlaceIcon fontSize="small" color={point ? "primary" : "disabled"} />
                <Typography variant="body2" color="text.secondary">
                  {point
                    ? `Точка: ${point[0].toFixed(6)}, ${point[1].toFixed(6)}`
                    : "Кликните по карте, чтобы поставить точку офиса"}
                </Typography>
              </Stack>

              <Box
                sx={{
                  height: 320,
                  overflow: "hidden",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <YandexMap
                  state={{
                    center: point ?? DEFAULT_CENTER,
                    zoom: point ? 15 : 9,
                  }}
                  width="100%"
                  height="100%"
                  options={{ suppressMapOpenBlock: true }}
                  onClick={handleMapClick}
                >
                  {point && (
                    <Placemark
                      geometry={point}
                      options={{
                        preset: "islands#redDotIcon",
                        draggable: false,
                      }}
                    />
                  )}
                </YandexMap>
              </Box>
            </Box>

            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              disabled={isSubmitting}
            >
              {formData.photo ? formData.photo.name : "Загрузить фото"}
              <input
                type="file"
                hidden
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleInputChange("photo")}
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={18} /> : undefined}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default NewOfficesBar;
