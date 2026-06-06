import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import LayersIcon from "@mui/icons-material/Layers"
import OpenInNewIcon from "@mui/icons-material/OpenInNew"
import { useNavigate } from "react-router-dom"
import { $activeOffice } from "@shared/api/Offices/GetOfficeById"
import { useUnit } from "effector-react"
import { useEffect } from "react"
import {
  $activeOfficeLoading,
  fetchOfficeByIdFx,
} from "@shared/api/Offices/GetOfficeById"
import { TOffice } from "@entities/Office/type/office"
import { getImageUrl } from "@shared/utils/getImageUrl"
import { $user } from "@shared/store/auth"

interface OfficeInfoBarProps {
  open: boolean
  activeOfficeId: number | null
  activeOffice: TOffice | null
  onClose: () => void
}

export default function OfficeInfoBar({
  open,
  activeOfficeId,
  activeOffice,
  onClose,
}: OfficeInfoBarProps) {
  const navigate = useNavigate()
  const office = useUnit($activeOffice)
  const loading = useUnit($activeOfficeLoading)
  const user = useUnit($user)
  const canEdit = user?.role === "ADMIN"

  useEffect(() => {
    if (!open || !activeOfficeId) return
    fetchOfficeByIdFx(activeOfficeId)
  }, [open, activeOfficeId])

  const currentOffice = office?.id === activeOfficeId ? office : null
  const photoUrl = getImageUrl(activeOffice?.photoUrl)
  const floors = currentOffice?.floors ?? []

  const handleCreateFloor = () => {
    if (!activeOfficeId) return
    onClose()
    navigate(`/office/${activeOfficeId}/createfloor`)
  }

  const handleOpenFloor = (floorId: number) => {
    if (!activeOfficeId) return
    onClose()
    navigate(`/office/${activeOfficeId}/floor/${floorId}`)
  }

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
              {photoUrl ? (
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateFloor}>
            {floors.length === 0 ? "Создать первый этаж" : "Добавить этаж"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
