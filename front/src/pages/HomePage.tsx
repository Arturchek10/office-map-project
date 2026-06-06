import { YMaps } from "@pbe/react-yandex-maps";
import CssBaseline from "@mui/material/CssBaseline";
import MapOffice from "@features/Map/Map";
import NavBar from "@entities/NavBar/NavBar";
import OfficesBar from "@features/OfficesBar/OfficesBar";
import {
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useUnit } from "effector-react";
import {
  $offices,
  $officesError,
  $officesLoading,
  fetchOfficesFx,
} from "@shared/api/Offices/GetOfficesList";
import Header from "@entities/Header/Header";
import NewOfficesBar from "@features/addingNewOffices/NewOfficesBar";
import { addOfficeFx } from "@shared/api/Offices/AddOffice";
import OfficeInfoBar from "@features/OfficeInfoBar/OfficeInfoBar";

function HomePage() {

  console.log("HOME PAGE RENDER");

  const [isOfficesBarOpen, setIsOfficesBarOpen] = useState(false);
  const [isNewOfficeBarOpen, setIsNewOfficeBarOpen] = useState(false);
  const [activeOfficeId, setActiveOfficeId] = useState<number | null>(null);

  const isOfficeInfoOpen = activeOfficeId !== null;

  const [offices, loading, error] = useUnit([
    $offices,
    $officesLoading,
    $officesError,
  ]);

  const selectedOffice = offices.find((o) => o.id === activeOfficeId) ?? null;

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    fetchOfficesFx();
  }, []);

  const toggleOfficesBar = () => setIsOfficesBarOpen((prev) => !prev);

  // Единая точка выбора офиса.
  // Используется и картой, и боковой панелью.
  // Повторный клик по активному офису снимает выделение.
  const handleSetActiveOfficeId = (id: number | null) => {
    setActiveOfficeId((prev) => (prev === id ? null : id));
    console.log("метод внутри HomePage: handleSetActiveOfficeId");
    if (!isOfficesBarOpen && id !== null) {
      setIsOfficesBarOpen(true);
    }
  };

  // функция сброса активного офиса и его id
  const resetActiveOffice = () => {
    setActiveOfficeId(null);
  };

  const handleAddOffice = async (formData: FormData) => {
    try {
      await addOfficeFx(formData);
      await fetchOfficesFx();

      setSnackbar({
        open: true,
        message: "Офис успешно сохранен",
        severity: "success",
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Ошибка при сохранении офиса";
      setSnackbar({
        open: true,
        message,
        severity: "error",
      });
      throw new Error(message);
    }
  };


  if (error) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 2,
        }}
      >
        <Typography variant="h3" align="center" color="error">
          Ошибка загрузки офисов: {error?.message || "Неизвестная ошибка"}
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress size={80} />
      </Box>
    );
  }

  return (
    <>
      <Header officeName="" />
      <Box sx={{ display: "flex", height: "100vh" }}>
        <CssBaseline />
        <NavBar onToggleOffices={toggleOfficesBar} />

        <MapOffice
          offices={offices}
          activeOfficeId={activeOfficeId}
          setActiveOfficeId={handleSetActiveOfficeId}
        />
        <OfficesBar
          offices={offices}
          open={isOfficesBarOpen}
          activeOfficeId={activeOfficeId}
          // isInsideOffice={isInsideOffice}
          handleSetActiveOfficeId={handleSetActiveOfficeId}
          resetActiveOffice={resetActiveOffice}
        />
        {/* OfficeInfoBar */}
        <OfficeInfoBar
          open={isOfficeInfoOpen}
          activeOfficeId={activeOfficeId}
          activeOffice={selectedOffice}
          onClose={() => setActiveOfficeId(null)}
        />
        <YMaps
          query={{
            apikey: "1aba321e-4a90-4692-8d6e-7a20d8e6c5f8",
            load: "geocode",
          }}
        >
          <NewOfficesBar
            open={isNewOfficeBarOpen}
            setOpen={setIsNewOfficeBarOpen}
            onAddOffice={handleAddOffice}
          />
        </YMaps>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default HomePage;
