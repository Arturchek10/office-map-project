export type YandexCoordinates = [number, number];

type YandexGeoObject = {
  geometry: {
    getCoordinates: () => number[];
  };
};

export type YMapsGeocoderApi = {
  geocode: (
    query: string,
    options?: Record<string, unknown>,
  ) => Promise<{
    geoObjects: {
      get: (index: number) => YandexGeoObject | undefined;
    };
  }>;
};

const COORDINATE_PAIR_REGEXP =
  /^\s*([-+]?\d+(?:[.,]\d+)?)\s*[,;]\s*([-+]?\d+(?:[.,]\d+)?)\s*$/;

export function buildAddressQuery(city: string, address: string) {
  return [city, address]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

export function isCoordinateLikeQuery(query: string) {
  return COORDINATE_PAIR_REGEXP.test(query);
}

export function parseCoordinatesQuery(query: string): YandexCoordinates | null {
  const match = query.match(COORDINATE_PAIR_REGEXP);
  if (!match) return null;

  const rawLatitude = Number(match[1].replace(",", "."));
  const rawLongitude = Number(match[2].replace(",", "."));

  if (!Number.isFinite(rawLatitude) || !Number.isFinite(rawLongitude)) {
    return null;
  }

  if (!isValidCoordinates(rawLatitude, rawLongitude)) {
    return null;
  }

  return [rawLatitude, rawLongitude];
}

export async function resolveYandexCoordinates(
  ymapsApi: YMapsGeocoderApi | null,
  rawQuery: string,
): Promise<YandexCoordinates | null> {
  const query = rawQuery.trim().replace(/\s+/g, " ");
  if (!ymapsApi || query.length < 3) return null;

  const coordinates = parseCoordinatesQuery(query);
  if (coordinates) return coordinates;

  if (isCoordinateLikeQuery(query)) return null;

  try {
    const result = await ymapsApi.geocode(query, { results: 1 });
    const firstGeoObject = result.geoObjects.get(0);
    const resolvedCoordinates = firstGeoObject?.geometry.getCoordinates();

    if (!resolvedCoordinates || resolvedCoordinates.length < 2) {
      return null;
    }

    const [latitude, longitude] = resolvedCoordinates;
    if (!isValidCoordinates(latitude, longitude)) {
      return null;
    }

    return [latitude, longitude];
  } catch {
    return null;
  }
}

function isValidCoordinates(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}
