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

interface OfficeInfoBarProps {
  open: boolean;
  activeOfficeId: number | null;
  activeOffice: TOffice | null;
  onClose: () => void;
}

export default function OfficeInfoBar({
  open,
  activeOfficeId,
  activeOffice,
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

  useEffect(() => {
    if (!open || !activeOfficeId) return;
    fetchOfficeByIdFx(activeOfficeId);
  }, [open, activeOfficeId]);

  useEffect(() => {
    setEditOpen(false);
    setEditName(activeOffice?.name ?? "");
    setEditAddress(activeOffice?.address ?? "");
    setEditPhoto(null);
    setRemovePhoto(false);
    setSaveError("");
  }, [activeOffice?.id, activeOffice?.name, activeOffice?.address, open]);

  const currentOffice = office?.id === activeOfficeId ? office : null;
  const photoUrl = getImageUrl(activeOffice?.photoUrl);
  const floors = currentOffice?.floors ?? [];
  const canEdit =
    user?.role === "ADMIN" &&
    activeOffice?.createdByUserId != null &&
    Number(activeOffice.createdByUserId) === Number(user.id);

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
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <Stack spacing={2.5}>
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
