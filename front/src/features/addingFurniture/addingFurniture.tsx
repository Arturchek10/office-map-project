import { Button, Paper, Box, Typography, Snackbar, Alert } from "@mui/material"
import Furniture from "./Furniture/Furniture"
import { MarkerTypes } from "@shared/types/marker"
import { useState } from "react"
import {
  addFurnitureFx,
  FurnitureData,
} from "@shared/api/Furniture/AddFurniture"
import { updateFurnitureUIFx } from "@shared/api/Furniture/UpdateFurnitureUI"
import { updateFurniturePositionFx } from "@shared/api/Furniture/UpdateFurniturePosition"
import {
  $furnitureCatalog,
  getFurnitureCatalogFx,
} from "@shared/api/Furniture/GetFurnitureCatalog"
import { useUnit } from "effector-react"
import CreateFurnitureForm from "./CreateFurnitureForm"

type FurnitureMapItem = {
  id: number
  name: string
  photo: string
  position: {
    position_x: number
    position_y: number
  }
  width: number
  height: number
  angle: number
  saved?: boolean
}

interface AddingFurnitureProps {
  addFurniture: (item: {
    name: string
    photoUrl: string
    width?: number
    height?: number
  }) => void
  onSelectLayer: (layers: MarkerTypes[]) => void
  open: boolean
  setOpen: (open: boolean) => void
  setEditable: (editable: boolean) => void
  furnitureOnMap: FurnitureMapItem[]
  setFurnitureOnMap: React.Dispatch<React.SetStateAction<FurnitureMapItem[]>>
  currentFloorId?: number
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
  const furnitureCatalog = useUnit($furnitureCatalog)
  const [loading, setLoading] = useState(false)
  const [createFurnitureOpen, setCreateFurnitureOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: "success" | "error"
  }>({ open: false, message: "", severity: "success" })

  const handleSave = async () => {
    if (!currentFloorId) {
      setSnackbar({
        open: true,
        message: "Этаж не выбран",
        severity: "error",
      })
      return
    }

    try {
      setLoading(true)

      for (const item of furnitureOnMap) {
        if (!item.photo) continue

        const normalizedAngle = ((item.angle % 360) + 360) % 360

        if (item.saved) {
          await updateFurniturePositionFx({
            furnitureId: item.id,
            data: {
              position_x: item.position.position_x,
              position_y: item.position.position_y,
            },
          })
          await updateFurnitureUIFx({
            furnitureId: item.id,
            data: {
              angle: normalizedAngle,
              sizeFactor: item.width,
            },
          })
          continue
        }

        const furnitureData: FurnitureData = {
          name: item.name,
          position: item.position,
          photoUrl: item.photo,
        }

        const response = await addFurnitureFx({
          floorId: currentFloorId,
          data: furnitureData,
        })

        await updateFurnitureUIFx({
          furnitureId: response.id,
          data: {
            angle: normalizedAngle,
            sizeFactor: item.width,
          },
        })

        setFurnitureOnMap((prev) =>
          prev.map((furniture) =>
            furniture.id === item.id
              ? { ...furniture, id: response.id, saved: true }
              : furniture,
          ),
        )
      }

      setOpen(false)
      onSelectLayer(["workspace", "room", "emergency", "utility"])
      setEditable(false)
      setSnackbar({
        open: true,
        message: "Мебель сохранена",
        severity: "success",
      })
    } catch (e) {
      setSnackbar({
        open: true,
        message: e instanceof Error ? e.message : "Ошибка при сохранении мебели",
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Paper
        sx={{
          position: "fixed",
          top: 140,
          right: open ? 0 : -320,
          width: 320,
          maxHeight: "calc(100vh - 140px)",
          bgcolor: "white",
          boxShadow: 4,
          zIndex: 1100,
          transition: "right 0.3s ease",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          borderRadius: 1,
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" fontWeight={600}>
            Мебель
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Выберите элемент из каталога и разместите его на схеме.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            sx={{ mt: 1.5 }}
            onClick={() => setCreateFurnitureOpen(true)}
          >
            Создать элемент
          </Button>
        </Box>

        <Box
          sx={{
            p: 2,
            overflowY: "auto",
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(74px, 1fr))",
            gap: 1.5,
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
                  width: 80,
                  height: 80,
                })
              }
            />
          ))}

          {furnitureCatalog.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Каталог пуст. Создайте первый элемент мебели.
            </Typography>
          )}
        </Box>

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
            {loading ? "Сохраняем..." : `Сохранить мебель (${furnitureOnMap.length})`}
          </Button>
        </Box>
      </Paper>

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

      <CreateFurnitureForm
        open={createFurnitureOpen}
        onClose={async () => {
          setCreateFurnitureOpen(false)
          await getFurnitureCatalogFx()
        }}
      />
    </>
  )
}

export default AddingFurniture
