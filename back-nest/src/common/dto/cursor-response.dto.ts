export type CursorResponse<T> = {
  items: T[];
  nextCursor: number | null;
  hasMore: boolean;
};

export function toCursorResponse<T extends { id: number }>(
  items: T[],
  size: number,
): CursorResponse<T> {
  const hasMore = items.length > size;
  const visibleItems = hasMore ? items.slice(0, size) : items;

  return {
    items: visibleItems,
    nextCursor: hasMore ? visibleItems.at(-1)?.id ?? null : null,
    hasMore,
  };
}
