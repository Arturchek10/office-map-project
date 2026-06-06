import React, { useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material"
import { createFurnitureCatalogFx } from "@shared/api/Furniture/CreateFurnitureCatalog"
import { useUnit } from "effector-react"
import {
  $furnitureCatalog,
  setFurnitureCatalog,
} from "@shared/api/Furniture/GetFurnitureCatalog"

interface CreateFurnitureFormProps {
  open: boolean
  onClose: () => void
}

const CreateFurnitureForm: React.FC<CreateFurnitureFormProps> = ({
  open,
  onClose,
}) => {
  const furnitureCatalog = useUnit($furnitureCatalog)
  const [name, setName] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Проверяем тип файла
      const validTypes = ["image/png", "image/jpeg", "image/svg+xml"]
      if (!validTypes.includes(file.type)) {
        setError("Поддерживаются только файлы PNG, JPEG и SVG")
        return
      }

      setPhoto(file)
      setError("")

      // Создаем превью для изображений
      if (file.type !== "image/svg+xml") {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPhotoPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPhotoPreview("")
      }
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Введите название мебели")
      return
    }

    if (!photo) {
      setError("Выберите фотографию")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await createFurnitureCatalogFx({
        data: { name: name.trim() },
        photo,
      })

      // Добавляем новую мебель в каталог
      setFurnitureCatalog([...furnitureCatalog, response])

      // Очищаем форму
      setName("")
      setPhoto(null)
      setPhotoPreview("")

      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка при создании мебели"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setName("")
      setPhoto(null)
      setPhotoPreview("")
      setError("")
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Новая мебель</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Название мебели"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            disabled={loading}
          />

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Фотография (PNG/JPEG/SVG)
            </Typography>
            <Button
              variant="outlined"
              component="label"
              disabled={loading}
              fullWidth
            >
              {photo ? photo.name : "Выбрать файл"}
              <input
                type="file"
                hidden
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handlePhotoChange}
              />
            </Button>
          </Box>

          {photoPreview && (
            <Box sx={{ textAlign: "center" }}>
              <img
                src={photoPreview}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: 200,
                  objectFit: "contain",
                }}
              />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !name.trim() || !photo}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Создание..." : "Создать"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateFurnitureForm
