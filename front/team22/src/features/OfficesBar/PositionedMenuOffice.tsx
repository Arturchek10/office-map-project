// менюшка открывающаяся при клике на офис при клике должно открываться справа меню с описанием и кнопкой открыть

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import {useUnit} from "effector-react";
import { $user } from "@shared/store/auth";

interface PositionedMenuProps {
  menuPos: { x: number; y: number } | null;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const PositionedMenuOffice: React.FC<PositionedMenuProps> = ({
  menuPos,
  open,
  onClose,
  onDelete,
  onEdit,
}) => {
  const handleDelete = () => {
    onDelete();
    onClose();
    onEdit();
  };

  // достаем инфу о том админ или пользователь
  const user = useUnit($user);
  const canEdit = user?.role === "ADMIN";
  const canBook = user?.role === "USER";

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={menuPos ? { top: menuPos.y, left: menuPos.x } : undefined}
      sx={{
        zIndex: 9999, // Высокий z-index для отображения поверх всех элементов
      }}
      MenuListProps={{
        sx: {
          minWidth: 120,
          py: 0,
        },
      }}
    >
      <MenuItem
        onClick={onEdit}
        sx={{
          color: "#2F80ED",
          "&:hover": {
            backgroundColor: "#EDF2FA",
          },
        }}
      >
        {canEdit ? "Редактировать" : "Открыть"}
      </MenuItem>
      {canEdit && <MenuItem
        onClick={handleDelete}
        sx={{
          color: "#d32f2f",
          "&:hover": {
            backgroundColor: "#ffebee",
          },
        }}
      >
        Удалить
      </MenuItem>}
    </Menu>
  );
};

export default PositionedMenuOffice;
