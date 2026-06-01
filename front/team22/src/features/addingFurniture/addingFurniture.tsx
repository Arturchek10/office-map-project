import { Button, Paper, Box, Typography, Snackbar, Alert } from "@mui/material";
import Furniture from "./Furniture/Furniture";
import { MarkerTypes } from "@shared/types/marker";
import { useState } from "react";
import {
  addFurnitureFx,
  FurnitureData,
} from "@shared/api/Furniture/AddFurniture";
import { updateFurnitureUIFx } from "@shared/api/Furniture/UpdateFurnitureUI";

// ==================== СТАТИЧЕСКИЙ КАТАЛОГ ====================
const furnitureCatalog = [
  {
    id: 1,
    name: "Офисный стул",
    photoUrl: "/uploads/furniture/chair.svg",
    defaultWidth: 60,
    defaultHeight: 60,
  },
  {
    id: 2,
    name: "Рабочий стол",
    photoUrl: "/uploads/furniture/desk.svg",
    defaultWidth: 160,
    defaultHeight: 75,
  },
  {
    id: 3,
    name: "Диван",
    photoUrl: "/uploads/furniture/sofa.svg",
    defaultWidth: 180,
    defaultHeight: 90,
  },
  {
    id: 4,
    name: "Кресло",
    photoUrl: "/uploads/furniture/armchair.svg",
    defaultWidth: 70,
    defaultHeight: 70,
  },
  {
    id: 5,
    name: "Стол переговоров",
    photoUrl: "/uploads/furniture/conferenceTable.svg",
    defaultWidth: 240,
    defaultHeight: 110,
  },
] as const;

interface AddingFurnitureProps {
  addFurniture: (item: {
    name: string;
    photoUrl: string;
    width?: number;
    height?: number;
  }) => void;

  onSelectLayer: (layers: MarkerTypes[]) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  setEditable: (editable: boolean) => void;

  furnitureOnMap: any[];
  setFurnitureOnMap: React.Dispatch<React.SetStateAction<any[]>>;
  currentFloorId?: number;
}

function AddingFurniture({
  addFurniture,
  onSelectLayer,
  open,
  setOpen,
  setEditable,
  furnitureOnMap,
  setFurnitureOnMap,
  currentFloorId,
}: AddingFurnitureProps) {
  console.log("furnitureOnMap.length", furnitureOnMap);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const handleSave = async () => {
    console.log("=== НАЧАЛО СОХРАНЕНИЯ МЕБЕЛИ ===");
    console.log("currentFloorId из пропсов:", currentFloorId);
    console.log("furnitureOnMap count:", furnitureOnMap.length);
    if (!currentFloorId) {
      setSnackbar({ open: true, message: "Этаж не выбран", severity: "error" });
      return;
    }

    try {
      setLoading(true);

      for (const item of furnitureOnMap) {
        if (!item.photo) continue;

        const furnitureData: FurnitureData = {
          name: item.name,
          position: {
            position_x: item.position.position_x,
            position_y: item.position.position_y,
          },
          photoUrl: item.photo,
        };

        const response = await addFurnitureFx({
          floorId: currentFloorId,
          data: furnitureData,
        });

        const normalizedAngle = ((item.angle % 360) + 360) % 360;

        await updateFurnitureUIFx({
          furnitureId: response.id,
          data: {
            angle: normalizedAngle,
            sizeFactor: item.width,
          },
        });
        setFurnitureOnMap((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  id: response.id,
                  // можно добавить другие поля из response
                }
              : f,
          ),
        );
      }

      setOpen(false);
      onSelectLayer(["workspace", "room", "emergency", "utility"]);
      setEditable(false);

      setSnackbar({
        open: true,
        message: "Мебель успешно сохранена!",
        severity: "success",
      });
    } catch (e) {
      console.error(e);
      setSnackbar({
        open: true,
        message: "Ошибка при сохранении",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Paper
        sx={{
          position: "fixed",
          top: 120,
          right: open ? 0 : -280,
          width: 280,
          maxHeight: "calc(100vh - 140px)",
          bgcolor: "white",
          boxShadow: 4,
          zIndex: 1100,
          transition: "right 0.3s ease",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* плашка вдоль левой границы типо скрыть/закрыть каталога мебели */}
        <>Х</>
        {/* Заголовок */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" fontWeight={600}>
            Каталог мебели
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Выберите предметы для размещения
          </Typography>
        </Box>

        {/* Каталог - сетка иконок */}
        <Box
          sx={{
            p: 2,
            overflowY: "auto",
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
            gap: 2,
          }}
        >
          {furnitureCatalog.map((item) => (
            <Furniture
              key={item.id}
              name={item.name}
              photoUrl={item.photoUrl}
              onClick={() =>
                addFurniture({
                  name: item.name,
                  photoUrl: item.photoUrl,
                  width: item.defaultWidth,
                  height: item.defaultHeight,
                })
              }
            />
          ))}
        </Box>

        {/* Нижняя панель с кнопкой */}
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: "divider",
            backgroundColor: "white",
          }}
        >
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={loading || furnitureOnMap.length === 0}
            sx={{ height: 48, fontWeight: 600 }}
          >
            {loading
              ? "Сохраняем..."
              : `Сохранить на этаж (${furnitureOnMap.length})`}
          </Button>
        </Box>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default AddingFurniture;
