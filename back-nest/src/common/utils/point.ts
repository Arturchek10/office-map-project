import { Point } from '../dto/point.dto';

export function toPoint(
  positionX?: number | null,
  positionY?: number | null,
): Point | null {
  if (positionX == null || positionY == null) return null;
  return {
    position_x: positionX,
    position_y: positionY,
  };
}

export function applyPoint<T extends { positionX?: number; positionY?: number }>(
  target: T,
  point?: Point | null,
) {
  if (!point) return;
  target.positionX = point.position_x;
  target.positionY = point.position_y;
}
