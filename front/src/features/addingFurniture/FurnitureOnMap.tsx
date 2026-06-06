import React, { useRef, useState, useEffect, useMemo } from "react";
import { Image as KonvaImage, Transformer } from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import { getImageUrl } from "@shared/utils/getImageUrl";

interface FurnitureOnMapProps {
  id: number;
  photo: string;
  x: number;
  y: number;
  initialWidth?: number;
  initialHeight?: number;
  rotation?: number;
  editable?: boolean;
  onPositionChange?: (x: number, y: number) => void;
  onSizeChange?: (width: number, height: number) => void;
  onRotationChange?: (angle: number) => void;
  onContextMenu?: (id: number, pos: { x: number; y: number }) => void;
}

const snapToGrid = (value: number, gridSize = 5) =>
  Math.round(value / gridSize) * gridSize;

const FurnitureOnMap: React.FC<FurnitureOnMapProps> = ({
  id,
  photo,
  x,
  y,
  initialWidth = 60,
  initialHeight = 60,
  rotation: initialRotation = 0,
  editable = true,
  onPositionChange,
  onSizeChange,
  onRotationChange,
  onContextMenu,
}) => {
  // Защита от пустого photo
  if (!photo) {
    console.warn(`[Furniture ${id}] Received empty photo prop`);
    return null;
  }

  const fullPhotoUrl = useMemo(() => {
    const url = getImageUrl(photo);
    console.log(`[Furniture ${id}] Final URL:`, url);
    return url;
  }, [photo, id]);

  const [img] = useImage(fullPhotoUrl || "", "anonymous");

  const [size, setSize] = useState({
    width: initialWidth,
    height: initialHeight,
  });
  const [rotation, setRotation] = useState(initialRotation);

  const imageRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Логирование статуса загрузки
  useEffect(() => {
    if (img) {
      console.log(`[Furniture ${id}] ✅ Image LOADED successfully`);
    }
    // Убираем предупреждение при первом рендере
    else if (fullPhotoUrl && !img) {
      // Можно оставить предупреждение только если долго не грузится
      // или вообще убрать console.warn
      console.warn(`[Furniture ${id}] ❌ Image NOT loaded yet: ${fullPhotoUrl}`);
    }
  }, [img, fullPhotoUrl, id]);

  // Обновление позиции
  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.x(x);
      imageRef.current.y(y);
      imageRef.current.getLayer()?.batchDraw();
    }
  }, [x, y]);

  // Обновление Transformer
  useEffect(() => {
    if (editable && transformerRef.current && imageRef.current && img) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [editable, img]);

  if (!img) return null;

  return (
    <>
      <KonvaImage
        ref={imageRef}
        image={img}
        x={x}
        y={y}
        width={size.width}
        height={size.height}
        rotation={rotation}
        offsetX={size.width / 2}
        offsetY={size.height / 2}
        draggable={editable}
        onContextMenu={(e) => {
          e.evt.preventDefault();
          onContextMenu?.(id, { x: e.evt.clientX, y: e.evt.clientY });
        }}
        onDragEnd={(e) => {
          if (!editable) return;
          const newX = snapToGrid(e.target.x());
          const newY = snapToGrid(e.target.y());
          onPositionChange?.(newX, newY);
        }}
        onTransformEnd={() => {
          if (!editable || !imageRef.current) return;
          const node = imageRef.current;

          let newWidth = Math.round(node.width() * node.scaleX());
          let newHeight = Math.round(node.height() * node.scaleY());
          let newRotation = Math.round(node.rotation() / 15) * 15;

          newWidth = snapToGrid(newWidth);
          newHeight = snapToGrid(newHeight);

          setSize({ width: newWidth, height: newHeight });
          setRotation(newRotation);

          node.scaleX(1);
          node.scaleY(1);
          node.rotation(newRotation);

          onSizeChange?.(newWidth, newHeight);
          onRotationChange?.(newRotation);
        }}
      />

      {editable && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]}
          anchorStroke="#56CCF2"
          anchorFill="#56CCF2"
          borderStroke="#56CCF2"
          borderDash={[6, 3]}
        />
      )}
    </>
  );
};

export default FurnitureOnMap;
