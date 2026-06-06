import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useUnit } from "effector-react";
import { $user } from "@shared/store/auth";

interface PositionedMenuProps {
  menuPos: { x: number; y: number } | null;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const PositionedMenuOffice: React.FC<PositionedMenuProps> = ({
  open,
  onClose,
  onDelete,
  onEdit,
}) => {
  const user = useUnit($user);
  const canEdit = user?.role === "ADMIN";

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  const handleOpen = () => {
    onEdit();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{canEdit ? "Управление офисом" : "Офис"}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Выберите действие для выбранного офиса.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={canEdit ? <EditIcon /> : <OpenInNewIcon />}
            onClick={handleOpen}
          >
            {canEdit ? "Редактировать" : "Открыть"}
          </Button>
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
};

export default PositionedMenuOffice;
