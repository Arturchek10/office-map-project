import Office from "@entities/Office/ui/Office";
import type { TOffice } from "@entities/Office/type/office";
import { deleteOfficeFx } from "@shared/api/Offices/DeleteOffice";
import { fetchOfficeByIdFx } from "@shared/api/Offices/GetOfficeById";
import { $user } from "@shared/store/auth";
import { getFloorByIdFx } from "@shared/store/dataFromFloor";
import {
  Alert,
  Box,
  Button,
  Snackbar,
  Typography,
} from "@mui/material";
import { drawerWidth } from "@features/OfficesBar/config/config";
import { useUnit } from "effector-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PositionedMenuOffice from "./PositionedMenuOffice";

interface OfficesBarProps {
  offices: TOffice[];
  open: boolean;
  activeOfficeId?: number | null;
  onUserNavigation?: () => void;
  handleSetActiveOfficeId?: (id: number | null) => void;
  resetActiveOffice?: () => void;
}

export default function OfficesBar({
  offices,
  open,
  activeOfficeId,
  handleSetActiveOfficeId,
  resetActiveOffice,
}: OfficesBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const officeRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUnit($user);

  const isInsideOffice = location.pathname.startsWith("/office/");
  const canEdit = user?.role === "ADMIN";
  const sectionTitle =
    user?.role === "USER"
      ? "Офисы для аренды"
      : user?.role === "ADMIN"
        ? "Мои офисы"
        : "Все офисы";

  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleContextMenu = (event: React.MouseEvent, id: number) => {
    event.preventDefault();
    setMenuPos({ x: event.clientX, y: event.clientY });
    setSelectedOfficeId(id);
  };

  const handleCloseMenu = () => {
    setMenuPos(null);
    setSelectedOfficeId(null);
  };

  const handleDelete = async () => {
    if (!selectedOfficeId) return;

    try {
      await deleteOfficeFx(selectedOfficeId);

      if (selectedOfficeId === activeOfficeId) {
        navigate("/");
      }

      setSnackbar({
        open: true,
        message: "Офис удалён",
        severity: "success",
      });
    } catch (error) {
      console.error("Ошибка при удалении офиса:", error);
      setSnackbar({
        open: true,
        message: "Ошибка при удалении офиса",
        severity: "error",
      });
    } finally {
      handleCloseMenu();
    }
  };

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
    } catch (error) {
      console.error("Ошибка при открытии офиса:", error);
      setSnackbar({
        open: true,
        message: "Ошибка при открытии офиса",
        severity: "error",
      });
    } finally {
      handleCloseMenu();
    }
  };

  useEffect(() => {
    if (activeOfficeId == null) return;

    const officeEl = officeRefs.current[activeOfficeId];
    if (officeEl) {
      officeEl.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeOfficeId]);

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
            onClick={() => {
              resetActiveOffice?.();
              navigate("/");
            }}
          >
            Назад к списку офисов
          </Button>
        )}

        <Typography
          variant="subtitle2"
          sx={{ px: 1, pb: 1, color: "text.secondary", fontWeight: 700 }}
        >
          {sectionTitle}
        </Typography>

        {!isInsideOffice &&
          offices.map((office) => {
            const isActive = String(office.id) === String(activeOfficeId);
            const isNoFloors =
              office.floorsCount === 0 ||
              office.floorsCount === null ||
              office.floorsCount === undefined;
            const canClick = !isNoFloors || canEdit;

            return (
              <Box
                key={office.id}
                ref={(element: HTMLDivElement | null) => {
                  officeRefs.current[office.id] = element;
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
                onContextMenu={
                  canEdit ? (event) => handleContextMenu(event, office.id) : undefined
                }
              >
                <Office {...office} active={isActive} isNoFloors={isNoFloors} />
              </Box>
            );
          })}
      </Box>

      <PositionedMenuOffice
        menuPos={menuPos}
        open={Boolean(menuPos)}
        onClose={handleCloseMenu}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((state) => ({ ...state, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((state) => ({ ...state, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
