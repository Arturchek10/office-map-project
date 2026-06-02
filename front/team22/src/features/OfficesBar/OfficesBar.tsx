import { Box, Button } from "@mui/material";
import Office from "@entities/Office/ui/Office";
import type { TOffice } from "@entities/Office/type/office";
import { drawerWidth } from "@features/OfficesBar/config/config";
import { useEffect, useRef, useState } from "react";
import { useUnit } from "effector-react";
import { useNavigate } from "react-router-dom";
import { fetchOfficeByIdFx } from "@shared/api/Offices/GetOfficeById";
import { getFloorByIdFx } from "@shared/store/dataFromFloor";
import { deleteOfficeFx } from "@shared/api/Offices/DeleteOffice";
import PositionedMenuOffice from "./PositionedMenuOffice";
import { Snackbar, Alert } from "@mui/material";
import { useLocation } from "react-router-dom";
import { $user } from "@shared/store/auth";
//
interface OfficesBarProps {
  offices: TOffice[];
  open: boolean;
  activeOfficeId?: number | null;
  // isInsideOffice: boolean;
  onUserNavigation?: () => void;
  handleSetActiveOfficeId?: (id: number | null) => void;
  resetActiveOffice?: () => void;
}

function OfficesBar({
  offices,
  open,
  activeOfficeId,
  // isInsideOffice,
  onUserNavigation,
  // изменение активности офиса из HomePage
  handleSetActiveOfficeId,
  // сброс активного офиса
  resetActiveOffice,
}: OfficesBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const officeRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const navigate = useNavigate();

  const location = useLocation();
  const isInsideOffice = location.pathname.startsWith("/office/");

  // кто в роли
  const user = useUnit($user);
  const canEdit = user?.role === "ADMIN";

  // Состояние для контекстного меню
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  // Обработчик правой кнопки мыши
  const handleContextMenu = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedOfficeId(id);
  };

  // Закрытие контекстного меню
  const handleCloseMenu = () => {
    setMenuPos(null);
    setSelectedOfficeId(null);
  };

  // Удаление офиса
  const handleDelete = async () => {
    if (!selectedOfficeId) return;
    try {
      await deleteOfficeFx(selectedOfficeId);
      // Store обновится автоматически через deleteOfficeFx.doneData

      // Если удаляется активный офис, перенаправляем на главную страницу
      if (selectedOfficeId === activeOfficeId) {
        navigate("/");
      }

      setSnackbar({
        open: true,
        message: "Офис удален",
        severity: "success",
      });
    } catch (e) {
      console.error("Ошибка при удалении офиса:", e);
      setSnackbar({
        open: true,
        message: "Ошибка при удалении",
        severity: "error",
      });
    } finally {
      handleCloseMenu();
    }
  };

  // если этаж уже есть - открыть редактор, если нет - открыть создание этажа
  const handleEdit = async () => {
    if (!selectedOfficeId) return;

    try {
      const office = await fetchOfficeByIdFx(selectedOfficeId);

      if (office.startFloor === null) {
        navigate(`/office/${selectedOfficeId}/createfloor`);
      } else {
        navigate(`/office/${selectedOfficeId}/floor/${office.startFloor.id}`);
        getFloorByIdFx(office.startFloor.id);
      }
    } catch (e) {
      console.error("Ошибка при открытии редактора офиса:", e);
      setSnackbar({
        open: true,
        message: "Ошибка при открытии редактора",
        severity: "error",
      });
    } finally {
      handleCloseMenu();
    }
  };
  useEffect(() => {
    if (activeOfficeId != null) {
      const officeEl = officeRefs.current[activeOfficeId];
      if (officeEl) {
        officeEl.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [activeOfficeId]);

  console.log("isInsideOffice в OfficesBar:", isInsideOffice); // ← для отладки
  return (
    <>
      <Box
        ref={containerRef}
        sx={{
          position: "fixed",
          top: "60px",
          left: open ? drawerWidth : -(250 - drawerWidth),
          width: 250,
          height: "calc(100vh - 60px)",
          bgcolor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          borderRight: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          overflowY: "auto",
          transition: "left 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 1100,
          pt: "12px",
          pb: "12px",
          pl: "10px",
          pr: "10px",

          // Красивый скроллбар
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#d1d5db",
            borderRadius: "20px",
            "&:hover": {
              background: "#9ca3af",
            },
          },
        }}
      >
        {isInsideOffice && (
          <Button
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
            // startIcon={<ArrowBackIcon />}
            onClick={() => {
              resetActiveOffice?.();
              navigate("/");
            }}
          >
            Назад ко всем офисам
          </Button>
        )}
        {!isInsideOffice &&
          offices.map((office) => {
            const isActive = String(office.id) === String(activeOfficeId);
            console.log("variable office inside OfficeBar", office); //тип TOffice address city id latitude longitude name
            const isNoFloors =
              office.floorsCount === 0 ||
              office.floorsCount === null ||
              office.floorsCount === undefined;
            const canClick = !isNoFloors || canEdit;
            return (
              <Box
                key={office.id}
                ref={(el: HTMLDivElement | null) => {
                  officeRefs.current[office.id] = el;
                }}
                sx={{
                  borderRadius: "4px",
                  mb: 1,
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
                onClick={
                  canClick ? () => handleSetActiveOfficeId?.(office.id) : undefined
                }
                // onClick={() => handleClick(office.id)}
                onContextMenu={ canClick ? (e) => handleContextMenu(e, office.id) : undefined
                }
              >
                <Office {...office} active={isActive} isNoFloors={isNoFloors} />
              </Box>
            );
          })}
      </Box>

      {/* Контекстное меню */}
      <PositionedMenuOffice
        menuPos={menuPos}
        open={Boolean(menuPos)}
        onClose={handleCloseMenu}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      {/* Snackbar для уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default OfficesBar;
