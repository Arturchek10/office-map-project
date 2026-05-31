import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
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
  openBookingForm: () => void;
  canEdit: boolean;
  canBook: boolean;
};

export default function PositionedMenu({
  anchorForCircle,
  menuPos,
  onClose,
  openRedactor,
  selectedMarkerId,
  activeOfficeId,
  onShowDeleteAlert,
  openBookingForm,
  canEdit,
  canBook
}: PositionMenuProps) {
  const open = Boolean(anchorForCircle);
  const [getFloorById] = useUnit([getFloorByIdFx]);

  return (
    <div onClick={onClose}>
      <Menu
        id="demo-positioned-menu"
        aria-labelledby="demo-positioned-button"
        anchorEl={anchorForCircle}
        open={open}
        anchorReference="anchorPosition"
        anchorPosition={
          menuPos ? { top: menuPos.y, left: menuPos.x + 30 } : undefined
        }
        transitionDuration={1000}
      >
       {canBook && <MenuItem
          onClick={() => {
            onClose(); // закрытие меню выбора
            openBookingForm();
            console.log("openBookingForm() в компоненте DeleteRedactMenu");
            // открытие формы с временем где можно забронировать
          }}
        >
        Забронировать
        </MenuItem>}
        {canEdit && <MenuItem
          onClick={() => {
            onClose();
            openRedactor();
          }}
        >
          Редактировать
        </MenuItem>}
        {canEdit && <MenuItem
          onClick={async () => {
            onClose();
            console.log("id выбранного маркера: ", selectedMarkerId);
            if (selectedMarkerId !== null) {
              await deleteMarkerFx(selectedMarkerId);
              console.log("id выбранного маркера: ", selectedMarkerId);
            }
            console.log("должно быть удаление маркера");
            await getFloorById(activeOfficeId);
            console.log("обновление данных этажа");
            onShowDeleteAlert();
          }}
        >
          Удалить
        </MenuItem>}
      </Menu>
    </div>
  );
}
