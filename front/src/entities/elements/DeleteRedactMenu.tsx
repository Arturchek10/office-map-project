import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import RemoveShoppingCartIcon from "@mui/icons-material/RemoveShoppingCart";
import { deleteMarkerFx } from "@shared/store/markers";
import { getFloorByIdFx } from "@shared/store/floor";
import { useUnit } from "effector-react";

type PositionMenuProps = {
  anchorForCircle: HTMLElement | null;
  menuPos: { x: number; y: number } | null;
  onClose: () => void;
  openRedactor: () => void;
  selectedMarkerId: number | null;
  activeOfficeId: number;
  onShowDeleteAlert: () => void;
  openBookingForm?: () => void;
  toggleBulkBooking?: () => void;
  canEdit: boolean;
  canBook: boolean;
  canAddToBulk?: boolean;
  isInBulk?: boolean;
};

export default function PositionedMenu({
  anchorForCircle,
  onClose,
  openRedactor,
  selectedMarkerId,
  activeOfficeId,
  onShowDeleteAlert,
  toggleBulkBooking,
  canEdit,
  canBook,
  canAddToBulk = false,
  isInBulk = false,
}: PositionMenuProps) {
  const open = Boolean(anchorForCircle);
  const [getFloorById] = useUnit([getFloorByIdFx]);

  const handleBulk = () => {
    onClose();
    toggleBulkBooking?.();
  };

  const handleEdit = () => {
    onClose();
    openRedactor();
  };

  const handleDelete = async () => {
    onClose();
    if (selectedMarkerId !== null) {
      await deleteMarkerFx(selectedMarkerId);
    }
    await getFloorById(activeOfficeId);
    onShowDeleteAlert();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Маркер на плане</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Выберите действие для выбранного маркера.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Stack spacing={1} sx={{ width: "100%" }}>
          {canBook && canAddToBulk && (
            <Button
              fullWidth
              variant={isInBulk ? "outlined" : "contained"}
              color={isInBulk ? "warning" : "primary"}
              startIcon={
                isInBulk ? <RemoveShoppingCartIcon /> : <AddShoppingCartIcon />
              }
              onClick={handleBulk}
            >
              {isInBulk ? "Убрать из брони" : "Добавить в бронь"}
            </Button>
          )}

          {canBook && !canAddToBulk && (
            <Button fullWidth variant="outlined" disabled>
              Сначала проверьте доступность
            </Button>
          )}

          {canEdit && (
            <Button
              fullWidth
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Редактировать
            </Button>
          )}

          {canEdit && (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={handleDelete}
            >
              Удалить
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
