import { Button, Paper, TextField, Box, Typography } from "@mui/material";
import { useState } from "react";
import { useYMaps } from "@pbe/react-yandex-maps";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { $user } from "@shared/store/auth";
import { useUnit } from "effector-react";

interface NewOfficesBarProps {
  onAddOffice: (formData: FormData) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface YMapsApi {
  geocode: (
    query: string,
    options?: Record<string, unknown>,
  ) => Promise<{
    geoObjects: {
      get: (index: number) =>
        | {
            geometry: { getCoordinates: () => number[] };
          }
        | undefined;
    };
  }>;
}

function NewOfficesBar({ onAddOffice, open, setOpen }: NewOfficesBarProps) {

  const user = useUnit($user);

  const canEdit = user?.role === "ADMIN";
  const canBook = user?.role === "USER";

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    latitude: 0,
    longitude: 0,
    photo: null as File | null,
  });

  const toggle = () => {
    setOpen(!open);
  };

  async function getCoordinates(
    searchQuery: string,
    ymapsApi: YMapsApi | null,
  ) {
    if (!ymapsApi || !searchQuery.trim()) return null;
    try {
      const result = await ymapsApi.geocode(searchQuery, { results: 1 });
      const firstGeoObject = result.geoObjects.get(0);
      if (!firstGeoObject) return null;
      return firstGeoObject.geometry.getCoordinates();
    } catch {
      return null;
    }
  }

  const ymapsApi = useYMaps(["geocode"]) as YMapsApi | null;

  const handleSave = async () => {
    if (formData.name && formData.address && formData.city) {
      let coords: number[] | null = null;

      // формируем строку поиска (город + адрес)
      const query = `${formData.city}, ${formData.address}`;
      coords = await getCoordinates(query, ymapsApi);

      const officeData = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        latitude: coords ? coords[0] : 0,
        longitude: coords ? coords[1] : 0,
      };

      const data = new FormData();
      data.append(
        "data",
        new Blob([JSON.stringify(officeData)], { type: "application/json" }),
      );
      if (formData.photo) {
        data.append("photo", formData.photo);
      }
      // вывод в консоль данных офиса
      for (let [key, value] of data.entries()) {
        if (value instanceof Blob) {
          console.log(key, value.type, value.size);
          console.log(await value.text());
        } else {
          console.log(key, value);
        }
      }
      onAddOffice(data);
      console.log(data);
      setFormData({
        name: "",
        address: "",
        city: "",
        latitude: 0,
        longitude: 0,
        photo: null,
      });

      setOpen(false);
    }
  };

  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (field === "photo") {
        const file = e.target.files?.[0] || null;
        setFormData((prev) => ({ ...prev, photo: file }));
      } else {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      }
    };

  return (
    <>
      {/* Кнопка открытия/закрытия */}
      { canEdit && 
        <Button
          variant="contained"
          onClick={toggle}
          sx={{
            position: "fixed",
            top: 80,
            right: 32,
            zIndex: 1200,
            boxShadow: 2,
          }}
        >
          Новый офис
        </Button>
      }

      {/* Панель добавления офиса */}
      <Paper
        onClick={handlePanelClick}
        sx={{
          position: "fixed",
          top: 60,
          right: open ? 0 : -400,
          width: 380,
          maxHeight: "calc(100vh - 60px)",
          bgcolor: "white",
          boxShadow: 3,
          zIndex: 1300,
          transition: "right 0.3s ease",
          overflowY: "auto",
        }}
      >
        <Box sx={{ padding: 3 }}>
          <div className="mb-4 flex flex-col items-center relative">
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={toggle}
              sx={{
                alignSelf: "flex-start",
                mb: 1,
                minWidth: 0,
                padding: "6px 8px",
              }}
            >
              назад
            </Button>
            <Typography
              variant="h5"
              sx={{
                width: "100%",
                textAlign: "center",
                fontWeight: 500,
                lineHeight: 1.2,
              }}
            >
              Создать новый офис
            </Typography>
          </div>
          <TextField
            fullWidth
            label="Название офиса"
            value={formData.name}
            onChange={handleInputChange("name")}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            fullWidth
            label="Город"
            value={formData.city}
            onChange={handleInputChange("city")}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            fullWidth
            label="Адрес"
            value={formData.address}
            onChange={handleInputChange("address")}
            sx={{ mb: 2 }}
            required
          />

          {/* input для загрузки фото */}
          <Button variant="outlined" component="label" fullWidth sx={{ mb: 1 }}>
            {formData.photo ? formData.photo.name : "Загрузить фото"}
            <input
              type="file"
              hidden
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleInputChange("photo")}
            />
          </Button>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block" }}
          >
            Поддерживаются форматы: PNG, JPEG, SVG. Максимальный размер — 10 МБ.
          </Typography>
        </Box>

        {/* Липкий футер с кнопкой */}
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            background: "white",
            padding: 2,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Button
            fullWidth
            variant="contained"
            onClick={handleSave}
            disabled={!formData.name || !formData.address || !formData.city}
          >
            Добавить офис
          </Button>
        </Box>
      </Paper>
    </>
  );
}

export default NewOfficesBar;
