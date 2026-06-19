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
import { useNavigate } from "react-router-dom";
import {
  $offices,
  $officesError,
  $officesLoading,
  fetchOfficesFx,
} from "@shared/api/Offices/GetOfficesList";
import { fetchOfficeByIdFx } from "@shared/api/Offices/GetOfficeById";
import Header from "@entities/Header/Header";
import NewOfficesBar from "@features/addingNewOffices/NewOfficesBar";
import { addOfficeFx } from "@shared/api/Offices/AddOffice";
import { deleteOfficeFx } from "@shared/api/Offices/DeleteOffice";
import { getFloorByIdFx } from "@shared/store/dataFromFloor";
import { $user } from "@shared/store/auth";
import OfficeInfoBar from "@features/OfficeInfoBar/OfficeInfoBar";
import PositionedMenuOffice from "@features/OfficesBar/PositionedMenuOffice";

function HomePage() {

  console.log("HOME PAGE RENDER");

  const navigate = useNavigate();
  const [isOfficesBarOpen, setIsOfficesBarOpen] = useState(false);
  const [isNewOfficeBarOpen, setIsNewOfficeBarOpen] = useState(false);
  const [activeOfficeId, setActiveOfficeId] = useState<number | null>(null);
  const [officeInfoId, setOfficeInfoId] = useState<number | null>(null);
  const [contextOfficeId, setContextOfficeId] = useState<number | null>(null);

  const isOfficeInfoOpen = officeInfoId !== null;

  const [offices, loading, error] = useUnit([
    $offices,
    $officesLoading,
    $officesError,
  ]);
  const user = useUnit($user);

  const selectedOffice = offices.find((o) => o.id === officeInfoId) ?? null;

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

  // Единый обработчик выбора офиса.
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
    setOfficeInfoId(null);
  };

  const canManageOffice = (officeId: number) => {
    const office = offices.find((item) => item.id === officeId);
    return (
      user?.role === "ADMIN" &&
      office?.createdByUserId != null &&
      Number(office.createdByUserId) === Number(user.id)
    );
  };

  const openOfficeFloors = async (officeId: number) => {
    setActiveOfficeId(officeId);
    if (!isOfficesBarOpen) {
      setIsOfficesBarOpen(true);
    }

    try {
      const office = await fetchOfficeByIdFx(officeId);

      if (office.startFloor === null) {
        if (canManageOffice(officeId)) {
          navigate(`/office/${officeId}/createfloor`);
          return;
        }

        setSnackbar({
          open: true,
          message: "У офиса пока нет этажей.",
          severity: "warning",
        });
        return;
      }

      navigate(`/office/${officeId}/floor/${office.startFloor.id}`);
      getFloorByIdFx(office.startFloor.id);
    } catch (event) {
      setSnackbar({
        open: true,
        message:
          event instanceof Error ? event.message : "Не удалось открыть этажи офиса",
        severity: "error",
      });
    }
  };

  const openOfficeContext = (officeId: number) => {
    if (!canManageOffice(officeId)) return;
    setActiveOfficeId(officeId);
    setContextOfficeId(officeId);
  };

  const openOfficeEdit = (officeId: number) => {
    if (!canManageOffice(officeId)) return;
    setOfficeInfoId(officeId);
    setContextOfficeId(null);
  };

  const deleteOffice = async () => {
    if (!contextOfficeId) return;

    try {
      await deleteOfficeFx(contextOfficeId);
      await fetchOfficesFx();
      if (activeOfficeId === contextOfficeId) {
        setActiveOfficeId(null);
      }
      setOfficeInfoId(null);
      setContextOfficeId(null);
      setSnackbar({
        open: true,
        message: "Офис удалён",
        severity: "success",
      });
    } catch (event) {
      setSnackbar({
        open: true,
        message:
          event instanceof Error ? event.message : "Не удалось удалить офис",
        severity: "error",
      });
    }
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
          onOfficeClick={(officeId) => void openOfficeFloors(officeId)}
          onOfficeContextMenu={openOfficeContext}
        />
        <OfficesBar
          offices={offices}
          open={isOfficesBarOpen}
          activeOfficeId={activeOfficeId}
          // isInsideOffice={isInsideOffice}
          handleSetActiveOfficeId={handleSetActiveOfficeId}
          onOpenOfficeFloors={(officeId) => void openOfficeFloors(officeId)}
          onEditOfficeData={openOfficeEdit}
          resetActiveOffice={resetActiveOffice}
        />
        {/* OfficeInfoBar */}
        <OfficeInfoBar
          open={isOfficeInfoOpen}
          activeOfficeId={officeInfoId}
          activeOffice={selectedOffice}
          openEditByDefault
          onClose={() => setOfficeInfoId(null)}
        />
        <PositionedMenuOffice
          menuPos={contextOfficeId ? { x: 0, y: 0 } : null}
          open={contextOfficeId !== null}
          onClose={() => setContextOfficeId(null)}
          onDelete={() => void deleteOffice()}
          onEdit={() => contextOfficeId && openOfficeEdit(contextOfficeId)}
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
