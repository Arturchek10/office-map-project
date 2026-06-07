// OfficeMap.tsx
import { Alert, Button, Chip, Fade, Stack, TextField, Typography } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import useImage from "use-image";
import ImportImageEl from "../elements/ImportImageEl";
import { useState, useRef, useEffect, useMemo } from "react";
import type { ChangeEvent } from "react";
import Konva from "konva";
import FloorNavigation from "@entities/elements/FloorNavigation";
import MarkerTypeFilter from "../MarkerTypeFilter/MarkerTypeFilter";
import AddMarkerComponent from "@entities/SideMenu/AddMarkerComponent";
import type {
  Marker,
  MarkerResponse,
  MarkerRequest,
  MarkerTypes,
} from "@shared/types/marker";
import PositionedMenu from "@entities/elements/MenuForType";
import AddingFurniture from "@features/addingFurniture/addingFurniture";
import DeleteRedactMenu from "../elements/DeleteRedactMenu";
import RedactorMenu from "@entities/RedactorMenu/RedactorMenu";
import { useUnit } from "effector-react";
import PositionedMenuFurniture from "@features/addingFurniture/PositionedMenuFurniture";
import AddingFurnitureButton from "@features/addingFurniture/addingFurnitureButton";
import { $activeOffice } from "@shared/api/Offices/GetOfficeById";
import {
  $floorData,
  getFloorByIdFx,
  $markers,
  $furnitures,
} from "@shared/store/dataFromFloor";
import { addMarkerFx } from "@shared/store/markers";
import { updateFloorPlan } from "@shared/api/Floors/PatchFloorPhoto";
import CircularProgress from "@mui/material/CircularProgress";
import FloorStage from "./Layers/FloorStage";
import AddFloorButton from "@entities/elements/AddFloorButton";
import { getMarker } from "@shared/api/markers";
import { deleteFurnitureFx } from "@shared/api/Furniture/DeleteFurniture";
import { updateFurniturePositionFx } from "@shared/api/Furniture/UpdateFurniturePosition";
import { updateFurnitureUIFx } from "@shared/api/Furniture/UpdateFurnitureUI";
import { getImageUrl } from "@shared/utils/getImageUrl";
import BookingMarkerForm from "@entities/BookingMarkerForm/BookingMarkerForm";
import {
  createBulkBooking,
  getAvailableMarkersByFloor,
} from "@shared/api/Bookings";
import { $user } from "@shared/store/auth";
import { useNavigate, useParams } from "react-router-dom";

export default function OfficeMap() {
  // достаем информацию о правах пользователя через auth
  const user = useUnit($user);
  const navigate = useNavigate();
  const { officeId, floorId } = useParams<{
    officeId: string;
    floorId: string;
  }>();

  const isAdmin = user?.role === "ADMIN";
  const canBook = user?.role === "USER";
  const [schemaUnlocked, setSchemaUnlocked] = useState(false);

  // сторы
  // размер изображения
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // размеры stage
  const [stageSize, setStageSizes] = useState({ x: 0, y: 0 });
  // начальная позиция изображения
  const [startImagePosition, setStartImagePosition] = useState({ x: 0, y: 0 });
  // масштаб картинки
  const [scale, setScale] = useState<number>(1);
  // масштаб маркера
  const [markerScale, setMarkerScale] = useState<number>(1);
  // состояние для фото этажа
  // const [currentFloorPhoto, setCurrentFloorPhoto] = useState<string | null>(
  //   null
  // );
  // стор для фильтра по типам
  const [visibleTypes, setVisibleTypes] = useState<MarkerTypes[]>([
    "workspace",
    "room",
    "emergency",
    "utility",
  ]);

  // меню для выбора типа при создании маркера
  const [newMarkerId, setNewMarkerId] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isOpenedMenuForType, setIsOpenedMenuForType] = useState(false);
  // показать успешную загрузку
  const [showAlertSuccess, setShowAlertSuccess] = useState(false);
  // показать неудачную загрузку
  const [showFailedAlert, setShowFailedAlert] = useState(false);

  // сторы для delete/redact меню
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteRedactMenuIsOpen, setDeleteRedactMenuIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [anchorForCircle, setAnchorForCircle] = useState<HTMLElement | null>(
    null,
  );
  const [clickedMarker, setClickedMarker] = useState<MarkerResponse | null>(
    null,
  );

  const [isRedactorOpen, setIsRedactorOpen] = useState(false);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [bulkBookingDate, setBulkBookingDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [bulkStartTime, setBulkStartTime] = useState("09:00");
  const [bulkEndTime, setBulkEndTime] = useState("18:00");
  const [availableMarkerIds, setAvailableMarkerIds] = useState<Set<number> | null>(
    null,
  );
  const [selectedBulkMarkerIds, setSelectedBulkMarkerIds] = useState<number[]>([]);
  const [bulkBookingLoading, setBulkBookingLoading] = useState(false);
  const [bulkBookingError, setBulkBookingError] = useState("");
  const [bulkBookingSuccess, setBulkBookingSuccess] = useState("");
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  // Furniture
  const [panelOpen, setPanelOpen] = useState(false);
  const [furnitureOnMap, setFurnitureOnMap] = useState<
    {
      id: number;
      name: string;
      photo: string;
      position: {
        position_x: number;
        position_y: number;
      };
      width: number;
      height: number;
      angle: number;
      saved?: boolean;
    }[]
  >([]);

  // Furniture context menu
  const [furnitureMenuPos, setFurnitureMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<number | null>(
    null,
  );
  // размер мебели
  const [lastSize] = useState({ width: 30, height: 30 });

  const allowedTypes: string[] = ["image/jpeg", "image/jpg", "image/png"];

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  const startImageScale: number =
    imageSize.width && imageSize.height
      ? Math.min(
          (stageSize.x / imageSize.width) * 0.8,
          (stageSize.y / imageSize.height) * 0.8,
        )
      : 1;

  const [currentFloor] = useUnit([$floorData]);
  const [activeOffice, getFloorById] = useUnit([$activeOffice, getFloorByIdFx]);
  const canEdit =
    isAdmin &&
    activeOffice?.createdByUserId != null &&
    Number(activeOffice.createdByUserId) === Number(user?.id);

  useEffect(() => {
    if (!canEdit) {
      setSchemaUnlocked(false);
    }
  }, [canEdit]);

  // url изображения текущего этажа
  const floorImageUrl = getImageUrl(currentFloor?.photoUrl);
  // проверяем есть ли изображение у этажа
  const hasImage = !!floorImageUrl;

  const [currentFloorImage, imageStatus] = useImage(
    floorImageUrl || "",
    "anonymous",
  );

  // console.log("currentFloor?.photoUrl:", currentFloor?.photoUrl);
  // console.log("floorImageUrl:", floorImageUrl);
  // console.log("imageStatus:", imageStatus);

  useEffect(() => {
    const routeFloorId = Number(floorId);
    if (Number.isFinite(routeFloorId) && routeFloorId > 0) {
      getFloorById(routeFloorId);
    }
  }, [floorId, getFloorById]);

  // const [currentFloor] = useUnit([$currentFloor])

  // стор маркеров

  const [markers] = useUnit([$markers]);

  const bulkStartDateTime = `${bulkBookingDate}T${bulkStartTime}:00`;
  const bulkEndDateTime = `${bulkBookingDate}T${bulkEndTime}:00`;

  const displayedMarkers = useMemo(() => {
    if (!canBook || !availabilityChecked || !availableMarkerIds) return markers;
    return markers.filter((marker) => availableMarkerIds.has(marker.id));
  }, [availabilityChecked, availableMarkerIds, canBook, markers]);

  const selectedBulkMarkers = useMemo(
    () => markers.filter((marker) => selectedBulkMarkerIds.includes(marker.id)),
    [markers, selectedBulkMarkerIds],
  );

  const bulkBookingHours = useMemo(() => {
    const start = new Date(bulkStartDateTime);
    const end = new Date(bulkEndDateTime);
    const hours = (end.getTime() - start.getTime()) / (60 * 60 * 1000);
    return Number.isFinite(hours) && hours > 0 ? hours : 0;
  }, [bulkEndDateTime, bulkStartDateTime]);

  const bulkBookingTotal = selectedBulkMarkers.reduce(
    (sum, marker) => sum + Number(marker.pricePerHour ?? 0) * bulkBookingHours,
    0,
  );

  const isBulkBookingReady =
    canBook && availabilityChecked && availableMarkerIds !== null && bulkBookingHours > 0;

  const refreshAvailableMarkers = async () => {
    if (!currentFloor?.id) return;

    setBulkBookingError("");
    setBulkBookingSuccess("");
    setAvailabilityChecked(false);
    setAvailableMarkerIds(null);
    setSelectedBulkMarkerIds([]);
    if (!bulkBookingDate || !bulkStartTime || !bulkEndTime || bulkBookingHours <= 0) {
      setBulkBookingError("Выберите корректные дату и время аренды");
      return;
    }

    setBulkBookingLoading(true);
    try {
      const available = await getAvailableMarkersByFloor(
        currentFloor.id,
        bulkStartDateTime,
        bulkEndDateTime,
      );
      const ids = new Set(available.map((marker) => marker.id));
      setAvailableMarkerIds(ids);
      setAvailabilityChecked(true);
      setBulkBookingSuccess(`Свободно мест: ${ids.size}`);
    } catch (error) {
      setAvailableMarkerIds(null);
      setSelectedBulkMarkerIds([]);
      setAvailabilityChecked(false);
      setBulkBookingError(
        error instanceof Error
          ? error.message
          : "Не удалось проверить доступность мест",
      );
    } finally {
      setBulkBookingLoading(false);
    }
  };

  const createSelectedBulkBooking = async () => {
    setBulkBookingError("");
    setBulkBookingSuccess("");

    if (!isBulkBookingReady) {
      setBulkBookingError("Сначала проверьте доступность маркеров");
      return;
    }

    if (selectedBulkMarkerIds.length === 0) {
      setBulkBookingError("Выберите хотя бы одно место на схеме");
      return;
    }

    setBulkBookingLoading(true);
    try {
      await createBulkBooking({
        markerIds: selectedBulkMarkerIds,
        startTime: bulkStartDateTime,
        endTime: bulkEndDateTime,
      });
      setSelectedBulkMarkerIds([]);
      setBulkBookingSuccess("Бронь создана");
      await refreshAvailableMarkers();
    } catch (error) {
      setBulkBookingError(
        error instanceof Error ? error.message : "Не удалось создать бронь",
      );
    } finally {
      setBulkBookingLoading(false);
    }
  };

  useEffect(() => {
    setAvailableMarkerIds(null);
    setSelectedBulkMarkerIds([]);
    setAvailabilityChecked(false);
    setBulkBookingError("");
    setBulkBookingSuccess("");
  }, [bulkBookingDate, bulkStartTime, bulkEndTime, currentFloor?.id]);

  const furnitures = useUnit($furnitures);

  useEffect(() => {
    if (!furnitures) {
      setFurnitureOnMap([]);
      return;
    }

    const mapped = furnitures.map((f) => ({
      id: f.id,
      name: f.name,
      photo: f.photoUrl,
      position: f.position,
      width: f.sizeFactor || 80,
      height: f.sizeFactor || 80,
      angle: f.angle || 0,
      saved: true,
    }));

    setFurnitureOnMap(
      mapped.map((item) => {
        const visibleSize = item.width < 10 ? Math.max(50, item.width * 80) : item.width;
        return {
          ...item,
          width: visibleSize,
          height: visibleSize,
        };
      }),
    );
  }, [furnitures]); // оставляем, но делаем чище

  // Добавление вручную через панель
  const addFurnitureToMap = (item: {
    name: string;
    photoUrl: string;
    width?: number;
    height?: number;
  }) => {
    // console.log("Добавляем мебель на карту:", item);

    if (!item.photoUrl) {
      console.error("У мебели отсутствует photoUrl:", item);
      return;
    }

    // Устанавливаем позицию в центре изображения
    const centerX = imageSize.width / 2;
    const centerY = imageSize.height / 2;

    const newFurniture = {
      name: item.name,
      photo: item.photoUrl, // Преобразуем photoUrl в photo
      id: Date.now(),
      position: {
        position_x: centerX,
        position_y: centerY,
      },
      width: item.width ?? lastSize.width,
      height: item.height ?? lastSize.height,
      angle: 0,
      saved: false,
    };

    console.log("Создана новая мебель:", newFurniture, {
      center: { x: centerX, y: centerY },
      imageSize,
    });
    setFurnitureOnMap((prev) => [...prev, newFurniture]);
  };

  const deleteFurniture = (id: number) => {
    setFurnitureOnMap((prev) => prev.filter((item) => item.id !== id));
  };

  // Функции для обновления размера и угла
  const updateFurnitureAngle = (id: number, angle: number) => {
    setFurnitureOnMap((prev) =>
      prev.map((item) => (item.id === id ? { ...item, angle } : item)),
    );

    const item = furnitureOnMap.find((f) => f.id === id);
    if (item?.saved) {
      void updateFurnitureUIFx({
        furnitureId: id,
        data: {
          angle: ((angle % 360) + 360) % 360,
          sizeFactor: item.width,
        },
      });
    }
  };

  const updateFurnitureSize = (id: number, width: number, height: number) => {
    // console.log("Обновляем размеры мебели:", { id, width, height });
    setFurnitureOnMap((prev) =>
      prev.map((item) => (item.id === id ? { ...item, width, height } : item)),
    );

    const item = furnitureOnMap.find((f) => f.id === id);
    if (item?.saved) {
      void updateFurnitureUIFx({
        furnitureId: id,
        data: {
          angle: item.angle,
          sizeFactor: width,
        },
      });
    }
  };

  const updateFurniturePosition = (id: number, x: number, y: number) => {
    // console.log("Обновляем позицию мебели:", { id, x, y });

    // Преобразуем координаты обратно в координаты относительно изображения
    const position_x = (x - startImagePosition.x) / startImageScale;
    const position_y = (y - startImagePosition.y) / startImageScale;

    // console.log("Преобразованные координаты:", { position_x, position_y });

    setFurnitureOnMap((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              position: { position_x, position_y },
            }
          : item,
      ),
    );

    const item = furnitureOnMap.find((f) => f.id === id);
    if (item?.saved) {
      void updateFurniturePositionFx({
        furnitureId: id,
        data: { position_x, position_y },
      });
    }
  };

  // меню для выбора типа при создании маркера

  const handleAddMarkerFunc = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setIsOpenedMenuForType(true);
  };

  const handleCloseMenu = () => setIsOpenedMenuForType(false);

  const handleSelectType = async (selectedType: MarkerTypes) => {
    setIsOpenedMenuForType(false);
    setAnchorEl(null);

    if (!currentFloorImage || imageSize.width <= 0 || imageSize.height <= 0) {
      showFailedAlertFunc();
      return;
    }

    const request: MarkerRequest = {
      type: selectedType,
      position: {
        position_x: imageSize.width / 2,
        position_y: imageSize.height / 2,
      },
    };

    // use fallback layerId if no current floor
    const layerId = currentFloor?.baseLayer?.id;
    if (!layerId) {
      console.error("Нет layerId для добавления маркера");
      return;
    }

    try {
      const createdMarker = await addMarkerFx({ marker: request, layerId });
      setNewMarkerId(createdMarker.id);
      if (currentFloor?.id) {
        await getFloorById(currentFloor.id);
      }

      setTimeout(() => {
        setNewMarkerId(null);
      }, 2000);

      console.log("Маркер успешно добавлен:", createdMarker);
    } catch (error) {
      console.error("Ошибка создания маркера:", error);
    }
  };

  const onSelectLayerFunc = (type: MarkerTypes[]) => {
    setVisibleTypes(type);
  };

  // zoom
  const scaleDiff = 0.05;
  const handleZoom = (event: Konva.KonvaEventObject<WheelEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const zoom = event.evt.deltaY > 0 ? -scaleDiff : scaleDiff;
    const newScale = Math.max(0.5, Math.min(2, oldScale + zoom));
    const newMarkerScale = 1 / newScale;

    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
    stage.batchDraw();

    setScale(newScale);
    setMarkerScale(newMarkerScale);
  };

  // effects
  useEffect(() => {
    if (currentFloorImage) {
      setStartImagePosition({
        x: (stageSize.x - imageSize.width * startImageScale) / 2,
        y: (stageSize.y - imageSize.height * startImageScale) / 2,
      });
    }
  }, [stageSize, imageSize, currentFloorImage, startImageScale]);

  useEffect(() => setScale(1), [currentFloorImage]);

  // обновляем размеры, когда картинка загрузилась

  useEffect(() => {
    // console.log(imageStatus);
    if (imageStatus === "loaded" && currentFloorImage) {
      setImageSize({
        width: currentFloorImage.width,
        height: currentFloorImage.height,
      });
      // console.log("Картинка загрузилась");
      setShowAlertSuccess(true);
      setTimeout(() => setShowAlertSuccess(false), 3000); // убираем через 3 секунды
    }
  }, [imageStatus, currentFloorImage]);

  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        setStageSizes({
          x: containerRef.current.offsetWidth,
          y: containerRef.current.offsetHeight,
        });
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Изменение картинки
  const showFailedAlertFunc = () => {
    setShowFailedAlert(true);
    setTimeout(() => setShowFailedAlert(false), 3000);
  };
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !allowedTypes.includes(file.type)) {
      showFailedAlertFunc();
      return;
    }

    if (!currentFloor?.id) return;
    // console.log("currentFloor.id", currentFloor.id);
    // console.log("file", file);

    try {
      await updateFloorPlan(currentFloor.id, false, file);
      // console.log("PATCH запрос на изменение этажа выполнен");

      // После успешного обновления обновляем локальное изображение
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const result = event.target?.result;
        if (typeof result === "string") {
          const img = new window.Image();
          img.onload = () =>
            setImageSize({ width: img.width, height: img.height });
          img.src = result;
        }
      };
      reader.readAsDataURL(file);
      // После локального обновления — перезагружаем этаж из API, чтобы синхронизировать все сторы
      await getFloorById(currentFloor.id);
    } catch (err) {
      console.error("Ошибка при изменении картинки", err);
    }
  };

  const onShowDeleteAlert = () => {
    setShowDeleteAlert(true);
    setTimeout(() => setShowDeleteAlert(false), 3000);
  };

  const toggleBulkMarker = (markerId: number) => {
    setSelectedBulkMarkerIds((prev) =>
      prev.includes(markerId)
        ? prev.filter((id) => id !== markerId)
        : [...prev, markerId],
    );
  };

  // обработчик клика по маркеру
  const handleCircleClick = async (
    event: Konva.KonvaEventObject<MouseEvent>,
    marker: Marker,
  ) => {
    const { clientX, clientY } = event.evt;
    const container = event.target.getStage()?.container();
    if (clientX && clientY && container) {
      setMenuPos({ x: clientX, y: clientY });
      setAnchorForCircle(container);
      setDeleteRedactMenuIsOpen(true);

      try {
        // Получаем свежие данные с сервера
        const markerFromServer = await getMarker(marker.id);
        console.log("маркер получени с сервера");
        console.log(marker);
        // Передаем их в редактор
        setClickedMarker(markerFromServer);
      } catch (err) {
        console.error("Ошибка при получении маркера с сервера", err);

        // На случай ошибки можно показать локальные данные
        setClickedMarker({
          id: marker.id,
          type: marker.type,
          position: marker.position,
          payload: marker.payload ?? {},
          pricePerHour: marker.pricePerHour,
        });
      }
    }
  };

  const handleFurnitureDelete = async () => {
    if (!selectedFurnitureId) return;

    if (selectedFurnitureId) {
      try {
        // Удаляем с сервера
        await deleteFurnitureFx(selectedFurnitureId);
        deleteFurniture(selectedFurnitureId);

        // // Удаляем из локального состояния
        // setSelectedFurnitureId(null);
        // setFurnitureMenuPos(null);
      } catch (error) {
        console.error("Ошибка при удалении мебели:", error);
      }
    }
  };

  const handleFurnitureMenuClose = () => {
    setSelectedFurnitureId(null);
    setFurnitureMenuPos(null);
  };

  const handleFurnitureContextMenu = (
    id: number,
    pos: { x: number; y: number },
  ) => {
    setSelectedFurnitureId(id);
    setFurnitureMenuPos(pos);
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-[90vw] h-[90vh] mt-[60px] ml-[90px]"
    >
      <div className="flex relative w-full gap-12 min-h-16 items-center">
        <Fade in={!!currentFloorImage} timeout={300} ref={ref}>
          <div className="flex items-center gap-2">
            <MarkerTypeFilter onSelectLayer={onSelectLayerFunc} />
          </div>
        </Fade>
        {canEdit && <AddFloorButton />}
        {canEdit && (
          <ImportImageEl
            onChange={handleFileChange}
            disabled={!currentFloor?.id}
          />
        )}
        {canEdit && (
          <Button
            variant={schemaUnlocked ? "contained" : "outlined"}
            color={schemaUnlocked ? "warning" : "primary"}
            startIcon={schemaUnlocked ? <LockOpenIcon /> : <LockIcon />}
            onClick={() => setSchemaUnlocked((prev) => !prev)}
          >
            {schemaUnlocked ? "Схема разблокирована" : "Схема заблокирована"}
          </Button>
        )}
        {canBook && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            useFlexGap
            flexWrap="wrap"
            sx={{
              bgcolor: "rgba(255,255,255,0.94)",
              border: "1px solid rgba(47,128,237,0.22)",
              borderRadius: 1,
              px: 1.5,
              py: 1,
              boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
            }}
          >
            <TextField
              label="Дата"
              type="date"
              size="small"
              value={bulkBookingDate}
              onChange={(event) => setBulkBookingDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="С"
              type="time"
              size="small"
              value={bulkStartTime}
              onChange={(event) => setBulkStartTime(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="До"
              type="time"
              size="small"
              value={bulkEndTime}
              onChange={(event) => setBulkEndTime(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="outlined"
              onClick={() => void refreshAvailableMarkers()}
              disabled={bulkBookingLoading}
            >
              Проверить доступность
            </Button>
            <Button
              variant="contained"
              onClick={() => void createSelectedBulkBooking()}
              disabled={!isBulkBookingReady || bulkBookingLoading}
            >
              Забронировать
            </Button>
            <Chip label={`Выбрано: ${selectedBulkMarkerIds.length}`} />
            <Typography variant="body2" fontWeight={700}>
              {bulkBookingTotal.toLocaleString("ru-RU", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })} ₽
            </Typography>
            {bulkBookingError && (
              <Typography variant="body2" color="error">
                {bulkBookingError}
              </Typography>
            )}
            {bulkBookingSuccess && (
              <Typography variant="body2" color="success.main">
                {bulkBookingSuccess}
              </Typography>
            )}
          </Stack>
        )}
        {canEdit && (
          <Fade
            in={!!currentFloorImage}
            timeout={300}
            mountOnEnter
            unmountOnExit
            ref={btnRef}
          >
            <div ref={btnRef} className="absolute right-[-55px]">
              <AddingFurnitureButton
                isPanelOpen={panelOpen}
                onClick={() => {
                  setPanelOpen((prev) => !prev);
                  setSchemaUnlocked(true);
                }}
              />
            </div>
          </Fade>
        )}
      </div>

      <Fade
        in={!!currentFloorImage || imageStatus === "loading"}
        timeout={300}
        mountOnEnter
        unmountOnExit
      >
        <div className="flex w-full relative">
          {showAlertSuccess && (
            <Fade timeout={300} in={showAlertSuccess}>
              <div className="absolute transform z-50 w-2xs">
                <Alert severity="success" className="mb-4">
                  Картинка успешно загружена!
                </Alert>
              </div>
            </Fade>
          )}
          {showDeleteAlert && (
            <Fade timeout={300} in={showDeleteAlert}>
              <div className="absolute transform z-50 w-2xs">
                <Alert severity="info" className="mb-4">
                  маркер удален
                </Alert>
              </div>
            </Fade>
          )}

          {showFailedAlert && (
            <Fade timeout={300} in={showFailedAlert} mountOnEnter unmountOnExit>
              <div className="absolute inset-0 flex items-center justify-center z-50">
                <Alert severity="error">
                  не удалось загрузить изображение. Попробуйте другой файл
                </Alert>
              </div>
            </Fade>
          )}
          {!hasImage && (
            <div className="absolute top-1/3 left-1/2 z-50 flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 gap-2 p-4 bg-white/80 rounded shadow">
              <p className="text-3xl font-semibold text-gray-700 text-center">
                изображение этажа отсутсвует
              </p>
              <p className="text-xl text-gray-500 text-center">
                загрузите изображение
              </p>
            </div>
          )}
          {hasImage && imageStatus === "loading" && (
            <>
              <div className="absolute top-1/3 left-1/2 z-50 flex items-center justify-center transform -translate-x-1/2 ">
                <CircularProgress size={80} />
              </div>
            </>
          )}
          {hasImage && imageStatus === "failed" && (
            <>
              {/* {console.log("ошибка загрузки изображения")} */}
              <div className="absolute flex item-center justify-center z-50 top-[100px] left-1/2 -translate-x-[80px]">
                <p className="text-5xl">ошибка загрузки изображения</p>
              </div>
            </>
          )}

          <FloorStage
            stageRef={stageRef}
            stageSize={stageSize}
            scale={scale}
            onWheel={handleZoom}
            clickedMarker={clickedMarker}
            setClickedMarker={setClickedMarker} // функция для сброса свечения
            markers={displayedMarkers}
            selectedMarkerIds={selectedBulkMarkerIds}
            newMarkerId={newMarkerId}
            image={currentFloorImage}
            imageStatus={imageStatus}
            startImagePosition={startImagePosition}
            startImageScale={startImageScale}
            furnitureOnMap={furnitureOnMap}
            updateFurniturePosition={updateFurniturePosition}
            updateFurnitureSize={updateFurnitureSize}
            updateFurnitureAngle={updateFurnitureAngle}
            panelOpen={panelOpen}
            handleCircleClick={handleCircleClick}
            markerScale={markerScale}
            visibleTypes={visibleTypes}
            onFurnitureContextMenu={handleFurnitureContextMenu}
            editable={canEdit && schemaUnlocked}
          />

          {panelOpen && (
            <PositionedMenuFurniture
              menuPos={furnitureMenuPos}
              open={!!furnitureMenuPos}
              onClose={handleFurnitureMenuClose}
              onDelete={handleFurnitureDelete}
            />
          )}

          {deleteRedactMenuIsOpen &&
            currentFloor?.id !== undefined && (
              <DeleteRedactMenu
                anchorForCircle={anchorForCircle}
                menuPos={menuPos}
                onClose={() => {
                  setAnchorForCircle(null);
                  setDeleteRedactMenuIsOpen(false);
                }}
                openRedactor={() => setIsRedactorOpen(true)}
                selectedMarkerId={clickedMarker?.id ?? null}
                activeOfficeId={currentFloor.id}
                onShowDeleteAlert={onShowDeleteAlert}
                toggleBulkBooking={() => {
                  if (clickedMarker?.id) {
                    toggleBulkMarker(clickedMarker.id);
                  }
                }}
                canEdit={canEdit}
                canBook={
                  canBook &&
                  (clickedMarker?.type === "workspace" ||
                    clickedMarker?.type === "room")
                }
                canAddToBulk={
                  isBulkBookingReady &&
                  (clickedMarker?.type === "workspace" ||
                    clickedMarker?.type === "room")
                }
                isInBulk={
                  clickedMarker?.id
                    ? selectedBulkMarkerIds.includes(clickedMarker.id)
                    : false
                }
              />
            )}

          {canEdit && (
            <div className="absolute top-24 ml-2 z-10 flex flex-col gap-2 bg-[#2F80ED] p-2 rounded-xl shadow w-24">
              <AddMarkerComponent handleAddMarker={handleAddMarkerFunc} />
              <PositionedMenu
                open={isOpenedMenuForType}
                onClose={handleCloseMenu}
                onSelect={handleSelectType}
                anchorEl={anchorEl}
              />
            </div>
          )}

          <div className="absolute top-50 ml-2 z-10 flex flex-col gap-2 bg-white/80 p-2 rounded shadow w-24">
            <div className="flex flex-col p-2 gap-10 items-center">
              <FloorNavigation
                floors={activeOffice?.floors ?? []}
                currentFloor={currentFloor}
                onChange={(floor) => {
                  if (officeId) {
                    navigate(`/office/${officeId}/floor/${floor.id}`);
                  }
                  getFloorById(floor.id);
                }}
              />
            </div>
          </div>

          {canEdit && (
            <AddingFurniture
              addFurniture={addFurnitureToMap}
              onSelectLayer={onSelectLayerFunc}
              open={panelOpen}
              setOpen={setPanelOpen}
              setEditable={setPanelOpen}
              furnitureOnMap={furnitureOnMap}
              setFurnitureOnMap={setFurnitureOnMap}
              // serverFurnitureIds={serverFurnitureIds}
              currentFloorId={currentFloor?.id}
            />
          )}
        </div>
      </Fade>
      {/* форма редактирования маркера (название/тип и тд) */}
      {canEdit && (
        <RedactorMenu
          isOpen={isRedactorOpen}
          onClose={() => setIsRedactorOpen(false)}
          selectedMarker={clickedMarker}
          onUpdate={async (updatedMarker) => {
            setClickedMarker(updatedMarker);
            if (currentFloor?.id) {
              await getFloorById(currentFloor.id);
            }
          }}
          
        />
      )}
      {/* форма бронирования маркера (время\дата) */}
      {canBook && (
        <BookingMarkerForm
          isOpen={isBookingFormOpen}
          onClose={() => setIsBookingFormOpen(false)}
          selectedMarker={clickedMarker}
          onBookingCreated={async () => {
            console.log("бронь создана, нужно обновить занятость");
          }}
        />
      )}
    </div>
  );
}
