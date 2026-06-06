import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

interface PositionedMenuProps {
  menuPos: { x: number; y: number } | null;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const PositionedMenuFurniture: React.FC<PositionedMenuProps> = ({
  open,
  onClose,
  onDelete,
}) => {
  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Мебель на плане</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Выберите действие для выбранного объекта.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlineIcon />}
          onClick={handleDelete}
        >
          Удалить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PositionedMenuFurniture;
