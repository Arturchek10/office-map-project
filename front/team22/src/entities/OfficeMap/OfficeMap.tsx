// OfficeMap.tsx
import { Fade } from "@mui/material";
import useImage from "use-image";
import ImportImageEl from "../elements/ImportImageEl";
import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import Konva from "konva";
import ZoomEl from "../elements/ZoomEl";
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
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import FloorStage from "./Layers/FloorStage";
import AddFloorButton from "@entities/elements/AddFloorButton";
import { getMarker } from "@shared/api/markers";
import { deleteFurnitureFx } from "@shared/api/Furniture/DeleteFurniture";
import { getImageUrl } from "@shared/utils/getImageUrl";
import BookingMarkerForm from "@entities/BookingMarkerForm/BookingMarkerForm";
import { $user } from "@shared/store/auth";

export default function OfficeMap() {
  // достаем информацию о правах пользователя через auth
  const user = useUnit($user);

  const canEdit = user?.role === "ADMIN";
  const canBook = user?.role === "USER";

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
    }[]
  >([]);

  // Отслеживаем ID мебели, которая уже была загружена с сервера
  const [serverFurnitureIds, setServerFurnitureIds] = useState<Set<number>>(
    new Set(),
  );
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

  // загрузка этажа
  const [activeOffice, getFloorById] = useUnit([$activeOffice, getFloorByIdFx]);

  useEffect(() => {
    if (activeOffice?.startFloor?.id) {
      getFloorById(activeOffice.startFloor.id);
      // console.log("---------------", activeOffice);
      // console.log("получаем этаж с ID:", activeOffice.startFloor.id);
    }
  }, [activeOffice?.startFloor?.id, getFloorById]);

  // const [currentFloor] = useUnit([$currentFloor])

  // стор маркеров

  const [markers] = useUnit([$markers]);

  const furnitures = useUnit($furnitures);

  useEffect(() => {
    if (!furnitures) {
      setFurnitureOnMap([]);
      setServerFurnitureIds(new Set());
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
    }));

    setFurnitureOnMap(mapped);
    setServerFurnitureIds(new Set(furnitures.map((f) => f.id)));
  }, [furnitures]); // оставляем, но делаем чище

  // Добавление вручную через панель
  const addFurnitureToMap = (item: { name: string; photoUrl: string }) => {
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
      width: lastSize.width,
      height: lastSize.height,
      angle: 0,
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
  };

  const updateFurnitureSize = (id: number, width: number, height: number) => {
    // console.log("Обновляем размеры мебели:", { id, width, height });
    setFurnitureOnMap((prev) =>
      prev.map((item) => (item.id === id ? { ...item, width, height } : item)),
    );
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

  // изменение масштаба картинки
  const increaseImageFunc = () => {
    if (scale < 2) {
      setScale((prev) => {
        const next = Number((prev + scaleDiff).toFixed(2));
        setMarkerScale(1 / next);
        return next;
      });
    }
  };

  const decreaseImageFunc = () => {
    if (scale > 0.5) {
      setScale((prev) => {
        const next = Number((prev - scaleDiff).toFixed(2));
        setMarkerScale(1 / next);
        return next;
      });
    }
  };

  // effects
  useEffect(() => {
    if (currentFloorImage) {
      setStartImagePosition({
        x: (stageSize.x - imageSize.width * startImageScale) / 2,
        y: (stageSize.y - imageSize.height * startImageScale) / 2,
      });
    }
  }, [stageSize, imageSize, currentFloorImage]);

  useEffect(() => setScale(1), [currentFloorImage]);

  // загрузка фото этажа при переходе
  useEffect(() => {
    if (!activeOffice?.startFloor?.id) return;
    (async () => {
      const floor = await getFloorById(activeOffice.startFloor.id);
      // console.log("photoUrl:", floor.photoUrl);
    })();
  }, [activeOffice?.startFloor?.id, getFloorById]);

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
          <div className="flex items-center gap-4">
            <MarkerTypeFilter onSelectLayer={onSelectLayerFunc} />
            {/* <ZoomEl
              increaseImage={increaseImageFunc}
              decreaseImage={decreaseImageFunc}
            /> */}
          </div>
        </Fade>
        {canEdit && <AddFloorButton />}
        {canEdit && <ImportImageEl onChange={handleFileChange} />}
        {canEdit && (
          <Fade
            in={!!currentFloorImage}
            timeout={300}
            mountOnEnter
            unmountOnExit
            ref={btnRef}
          >
            <div ref={btnRef} className="absolute right-[20px]">
              <AddingFurnitureButton isPanelOpen={panelOpen} onClick={() => setPanelOpen((prev) => !prev)} />
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
            markers={markers}
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
            activeOffice?.startFloor.id !== undefined && (
              <DeleteRedactMenu
                anchorForCircle={anchorForCircle}
                menuPos={menuPos}
                onClose={() => {
                  setAnchorForCircle(null);
                  setDeleteRedactMenuIsOpen(false);
                }}
                openRedactor={() => setIsRedactorOpen(true)}
                selectedMarkerId={clickedMarker?.id ?? null}
                activeOfficeId={activeOffice?.startFloor.id}
                onShowDeleteAlert={onShowDeleteAlert}
                openBookingForm={() => setIsBookingFormOpen(true)}
                canEdit={canEdit}
                canBook={canBook}
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
                onChange={(floor) => getFloorById(floor.id)}
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
          onUpdate={async (updatedMarker) => setClickedMarker(updatedMarker)}
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
