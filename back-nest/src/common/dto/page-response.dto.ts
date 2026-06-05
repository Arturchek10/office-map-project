export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export function toPageResponse<T>(
  content: T[],
  totalElements: number,
  page: number,
  size: number,
): PageResponse<T> {
  const totalPages = size > 0 ? Math.ceil(totalElements / size) : 0;

  return {
    content,
    totalElements,
    totalPages,
    size,
    number: page,
    first: page <= 0,
    last: totalPages === 0 || page >= totalPages - 1,
    empty: content.length === 0,
  };
}
