import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  ImageList,
  ImageListItem,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { addMarkerPhotos, deleteMarkerPhoto } from "@shared/api/markers";
import { updateMarkerFx } from "@shared/store/markers";
import type {
  MarkerResponse,
  MarkerTypes,
  workspaceMarker,
} from "@shared/types/marker";
import { getImageUrl } from "@shared/utils/getImageUrl";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";

type MarkerTypeRu = "Рабочее место" | "Переговорная" | "Безопасность" | "Утилита";

type RedactorMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedMarker: MarkerResponse | null;
  onUpdate: (updatedMarker: MarkerResponse) => void;
};

const markerTypes: MarkerTypeRu[] = [
  "Рабочее место",
  "Переговорная",
  "Безопасность",
  "Утилита",
];

const apiToRuType = (marker: MarkerResponse | null): MarkerTypeRu => {
  switch (marker?.type) {
    case "room":
      return "Переговорная";
    case "emergency":
      return "Безопасность";
    case "utility":
      return "Утилита";
    case "workspace":
    default:
      return "Рабочее место";
  }
};

const ruToApiType = (type: MarkerTypeRu): MarkerTypes => {
  switch (type) {
    case "Переговорная":
      return "room";
    case "Безопасность":
      return "emergency";
    case "Утилита":
      return "utility";
    case "Рабочее место":
    default:
      return "workspace";
  }
};

const isWorkspaceMarker = (
  marker: MarkerResponse | null,
): marker is workspaceMarker => Boolean(marker && marker.type === "workspace");

export default function RedactorMenu({
  isOpen,
  onClose,
  selectedMarker,
  onUpdate,
}: RedactorMenuProps) {
  const [selectedType, setSelectedType] = useState<MarkerTypeRu>("Рабочее место");
  const [name, setName] = useState("");
  const [deskAvailable, setDeskAvailable] = useState(false);
  const [uncomfortableDesk, setUncomfortableDesk] = useState(false);
  const [capacity, setCapacity] = useState(0);
  const [pricePerHour, setPricePerHour] = useState(0);
  const [error, setError] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    if (!selectedMarker) return;

    const payload = selectedMarker.payload ?? {};
    setSelectedType(apiToRuType(selectedMarker));
    setName(String(payload.text ?? selectedMarker.name ?? ""));
    setDeskAvailable(Boolean(payload.haveComputer));
    setCapacity(Number(payload.capacity ?? 0));
    setPricePerHour(Number(selectedMarker.pricePerHour ?? 0));
    setUncomfortableDesk(
      isWorkspaceMarker(selectedMarker)
        ? Boolean(selectedMarker.uncomfortable)
        : false,
    );
    setError("");
  }, [selectedMarker]);

  const saveAttributes = async () => {
    if (!selectedMarker) return;
    if (!name.trim()) {
      setError("Название маркера обязательно");
      return;
    }

    const payload: Record<string, unknown> = { text: name.trim() };
    if (selectedType === "Рабочее место") {
      payload.haveComputer = deskAvailable;
    }
    if (selectedType === "Переговорная") {
      payload.capacity = capacity;
    }

    try {
      const updatedMarker = await updateMarkerFx({
        markerId: selectedMarker.id,
        name: name.trim(),
        type: ruToApiType(selectedType),
        payload,
        pricePerHour:
          selectedType === "Рабочее место" || selectedType === "Переговорная"
            ? pricePerHour
            : 0,
        uncomfortable:
          selectedType === "Рабочее место" ? uncomfortableDesk : undefined,
      });

      onUpdate(updatedMarker);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить маркер");
    }
  };

  const uploadPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedMarker || !event.target.files?.length) return;

    setUploadingPhotos(true);
    setError("");
    try {
      const updatedMarker = await addMarkerPhotos(
        selectedMarker.id,
        Array.from(event.target.files),
      );
      onUpdate(updatedMarker);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить фото");
    } finally {
      setUploadingPhotos(false);
      event.target.value = "";
    }
  };

  const removePhoto = async (photoId: number) => {
    if (!selectedMarker) return;

    setError("");
    try {
      const updatedMarker = await deleteMarkerPhoto(selectedMarker.id, photoId);
      onUpdate(updatedMarker);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить фото");
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm" slotProps={{paper: {style: {marginTop: 50}}}}>
      <DialogTitle>Редактирование маркера</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            select
            label="Тип маркера"
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value as MarkerTypeRu)}
          >
            {markerTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Название"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={Boolean(error)}
            helperText={error || "Название будет видно пользователю при выборе маркера"}
          />

          {(selectedType === "Рабочее место" || selectedType === "Переговорная") && (
            <TextField
              label="Цена за час"
              type="number"
              value={pricePerHour}
              onChange={(event) =>
                setPricePerHour(Math.max(0, Number(event.target.value)))
              }
              inputProps={{ min: 0, step: 50 }}
              helperText="Используется при расчете стоимости аренды"
            />
          )}

          {selectedType === "Рабочее место" && (
            <Stack>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={deskAvailable}
                    onChange={(event) => setDeskAvailable(event.target.checked)}
                  />
                }
                label="Есть рабочий стол"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={uncomfortableDesk}
                    onChange={(event) => setUncomfortableDesk(event.target.checked)}
                  />
                }
                label="Некомфортное место"
              />
            </Stack>
          )}

          {selectedType === "Переговорная" && (
            <TextField
              label="Количество рабочих мест"
              type="number"
              value={capacity}
              onChange={(event) =>
                setCapacity(Math.max(0, Number(event.target.value)))
              }
            />
          )}

          {/* <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography fontWeight={700}>Галерея маркера</Typography>
              <Button
                component="label"
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                disabled={uploadingPhotos || !selectedMarker}
              >
                Добавить фото
                <input
                  hidden
                  multiple
                  accept="image/png,image/jpeg,image/jpg"
                  type="file"
                  onChange={uploadPhotos}
                />
              </Button>
            </Stack>
            {selectedMarker?.photos?.length ? (
              <ImageList cols={2} gap={8}>
                {selectedMarker.photos.map((photo) => (
                  <ImageListItem key={photo.id}>
                    <img
                      src={getImageUrl(photo.url)}
                      alt={selectedMarker.name ?? "Фото маркера"}
                      loading="lazy"
                      style={{ borderRadius: 6, height: 120, objectFit: "cover" }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => void removePhoto(photo.id)}
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        bgcolor: "rgba(255,255,255,0.9)",
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </ImageListItem>
                ))}
              </ImageList>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Фотографий пока нет.
              </Typography>
            )}
          </Box> */}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" startIcon={<CheckIcon />} onClick={saveAttributes}>
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
