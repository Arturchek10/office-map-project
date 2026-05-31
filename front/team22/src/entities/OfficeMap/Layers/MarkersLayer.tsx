// MarkersLayer.tsx
import { useRef, useEffect } from "react";
import Konva from "konva";
import { Layer, Circle } from "react-konva";
import { Marker, MarkerResponse } from "@shared/types/marker";
import { markerColor, strokeColor, MarkerTypes } from "@shared/types/marker";
import { useUnit } from "effector-react";
import { replaceMarkerFx } from "@shared/store/markers";

type MarkersProps = {
  markers: Marker[];
  visibleTypes: MarkerTypes[];
  clickedMarker: MarkerResponse | null;
  newMarkerId: number | null;
  imageStatus: string;
  markerScale: number;
  startImagePosition: { x: number; y: number };
  startImageScale: number;
  handleCircleClick: (
    event: Konva.KonvaEventObject<MouseEvent>,
    marker: Marker
  ) => void;
};

export default function MarkersLayer({
  markers,
  visibleTypes,
  clickedMarker,
  newMarkerId,
  imageStatus,
  markerScale,
  startImagePosition,
  startImageScale,
  handleCircleClick,
}: MarkersProps) {
  const glowBigRef = useRef<Konva.Circle | null>(null);
  const glowMidRef = useRef<Konva.Circle | null>(null);
  const markersRef = useRef<(Konva.Circle | null)[]>([]);
  const [] = useUnit([]);

  const clickedMarkerNode = markers.find((m) => m.id === clickedMarker?.id);
  const glowColor = clickedMarkerNode
    ? markerColor[clickedMarkerNode.type]
    : "#3A7EFC";

  // --- Эффект свечения ---

  //храним ссылку на анимацию, чтобы можно было останавливать  
  const glowAnimRef = useRef<Konva.Animation | null>(null);

  useEffect(() => {
    if (!clickedMarker) return;
    const big = glowBigRef.current;
    const mid = glowMidRef.current;
    if (!big || !mid) return;

    const startTime = Date.now();
    const anim = new Konva.Animation((frame) => {
      if (!frame) return;

      const elapsed = Date.now() - startTime;
      const fadeProgress = Math.min(elapsed / 500, 1);

      const scaleBig = 1 + 0.25 * Math.sin(frame.time / 1000);
      const opacityBig =
        (0.1 + 0.1 * Math.sin(frame.time / 500)) * fadeProgress;

      const scaleMid = 1 + 0.35 * Math.sin(frame.time / 1050);
      const opacityMid =
        (0.1 + 0.1 * Math.sin(frame.time / 1050)) * fadeProgress;

      big.scale({ x: scaleBig, y: scaleBig });
      big.opacity(opacityBig);

      mid.scale({ x: scaleMid, y: scaleMid });
      mid.opacity(opacityMid);
    }, big.getLayer());

    glowAnimRef.current = anim;
    anim.start();
    return () => {
      anim.stop();
    };
  }, [clickedMarker]);

  // --- Анимация падения при добавлении ---
  const prevMarkers = useRef<Marker[]>(markers);
  useEffect(() => {
  if (!newMarkerId) return;

  const addedMarker = markers.find((m) => m.id === newMarkerId);
  if (!addedMarker) return;

  const markerIndex = markers.findIndex((m) => m.id === addedMarker.id);
  const markerNode = markersRef.current[markerIndex];
  if (!markerNode) return;

  markerNode.y(0);

  const finalY =
    addedMarker.position.position_y * startImageScale +
    startImagePosition.y;

  new Konva.Tween({
    node: markerNode,
    duration: 2,
    y: finalY,
    easing: Konva.Easings.BounceEaseOut,
  }).play();
}, [newMarkerId, markers, startImageScale, startImagePosition.y]);

  // --- Следим за перетаскиванием и позиционированием свечения ---
  useEffect(() => {
    if (!clickedMarker) return;

    const updateGlowPosition = (x: number, y: number) => {
      if (!glowBigRef.current || !glowMidRef.current) return;
      glowBigRef.current.position({ x, y });
      glowMidRef.current.position({ x, y });
      glowBigRef.current.getLayer()?.batchDraw();
    };

    // Изначальная позиция glow при выборе маркера
    const markerNode = markersRef.current.find(
      (m) => m?.id() === clickedMarker.id.toString()
    );
    if (markerNode) {
      const { x, y } = markerNode.position();
      updateGlowPosition(x, y);
    }

    // Подписка на перетаскивание всех маркеров
    markersRef.current.forEach((node) => {
      node?.on("dragmove", (e) => {
        if (clickedMarker.id.toString() === node.id()) {
          const { x, y } = e.target.position();
          updateGlowPosition(x, y);
        }
      });
    });

    return () => {
      markersRef.current.forEach((node) => {
        node?.off("dragmove");
      });
    };
  }, [clickedMarker, markers]);

  useEffect(() => {
    // Если выбранный маркер больше не виден по фильтру
    if (clickedMarker && !visibleTypes.includes(clickedMarker.type)) {
      
      glowAnimRef.current?.stop(); // останавливаем анимацию свечения
      // Сброс opacity
      if (glowBigRef.current) {
        glowBigRef.current.opacity(0);
      }
      if (glowMidRef.current) {
        glowMidRef.current.opacity(0);
      }
    }
    console.log("visibleTypes: ", visibleTypes)
  }, [visibleTypes, clickedMarker]);

  return (
    <Layer>
      {/* Glow для выбранного маркера  */}
      {clickedMarker && clickedMarkerNode && (
        <>
          <Circle
            ref={glowBigRef}
            radius={20}
            fill={glowColor}
            opacity={0}
            shadowColor={glowColor}
            shadowBlur={40}
            shadowOpacity={0.6}
            shadowOffset={{ x: 0, y: 0 }}
          />
          <Circle
            ref={glowMidRef}
            radius={20}
            fill={glowColor}
            opacity={0}
            shadowColor={glowColor}
            shadowBlur={40}
            shadowOpacity={0.6}
            shadowOffset={{ x: 0, y: 0 }}
          />
        </>
      )}

      {/* --- Основные маркеры --- */}
      {imageStatus === "loaded" &&
        markers
          .filter((marker) => visibleTypes.includes(marker.type))
          .map((marker, index) => (
            <Circle
              ref={(node) => {
                markersRef.current[index] = node;
                if (node) node.id(marker.id.toString());
              }}
              key={marker.id}
              radius={10}
              fill={markerColor[marker.type] || "#3A7EFC"}
              x={
                marker.position.position_x * startImageScale +
                startImagePosition.x
              }
              y={
                marker.position.position_y * startImageScale +
                startImagePosition.y
              }
              stroke={strokeColor[marker.type] || "#0D49BF"}
              strokeWidth={3}
              draggable
              scale={{ x: markerScale, y: markerScale }}
              onDragEnd={async (e) => {
                const stageX = e.target.x();
                const stageY = e.target.y();
                // Преобразуем координаты обратно в координаты относительно изображения
                const position_x =
                  (stageX - startImagePosition.x) / startImageScale;
                const position_y =
                  (stageY - startImagePosition.y) / startImageScale;

                marker.position.position_x = position_x;
                marker.position.position_y = position_y;
                glowBigRef.current?.position({ x: stageX, y: stageY });
                glowMidRef.current?.position({ x: stageX, y: stageY });
                try {
                  await replaceMarkerFx({
                    markerId: marker.id,
                    position: { position_x, position_y },
                  });
                  console.log("Маркер перемещен успешно");
                } catch (err) {
                  console.error("Ошибка при перемещении маркера", err);
                }
              }}
              onClick={(e) => handleCircleClick(e, marker)}
            />
          ))}
    </Layer>
  );
}
