// компонент
import { YMaps, Map, Placemark, useYMaps } from "@pbe/react-yandex-maps";
import {
  Box,
  Paper,
  TextField,
  IconButton,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import * as React from "react";
import type { TOffice } from "@entities/Office/type/office";
import { useEffect } from "react";
import {
  resolveYandexCoordinates,
  type YMapsGeocoderApi,
} from "@shared/utils/yandexGeocode";

interface MapOfficeProps {
  offices: TOffice[];
  activeOfficeId: number | null;
  onOfficeClick: (officeId: number) => void;
  onOfficeContextMenu?: (officeId: number) => void;
}

type YMapLike = {
  setCenter: (
    coords: number[],
    zoom?: number,
    options?: Record<string, unknown>,
  ) => void;
};

interface YMapsApi extends YMapsGeocoderApi {
  SuggestView: new (
    input: HTMLInputElement,
    options?: Record<string, unknown>,
  ) => unknown;
}

function MapSearchOverlay({
  mapRef,
}: {
  mapRef: React.RefObject<YMapLike | null>;
}) {
  const ymapsApi = useYMaps([
    "SuggestView",
    "geocode",
  ]) as unknown as YMapsApi | null;
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchError, setSearchError] = React.useState("");
  const inputElementRef = React.useRef<HTMLInputElement | null>(null);

  const handleSearch = React.useCallback(async () => {
    const map = mapRef.current;
    if (!ymapsApi || !map || !searchQuery.trim()) return;

    setSearchError("");
    const coordinates = await resolveYandexCoordinates(ymapsApi, searchQuery);

    if (!coordinates) {
      setSearchError("Не удалось найти место");
      return;
    }

    map.setCenter(coordinates, 14, { duration: 300 });
  }, [searchQuery, ymapsApi, mapRef]);

  React.useEffect(() => {
    if (ymapsApi && inputElementRef.current) {
      try {
        new ymapsApi.SuggestView(inputElementRef.current, { results: 5 });
      } catch {
        // ignore
      }
    }
  }, [ymapsApi]);

  return (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        top: 80,
        left: "50%",
        transform: "translateX(-50%)",
        width: 360,
        p: 1,
      }}
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Поиск по адресу или месту"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          if (searchError) setSearchError("");
        }}
        error={Boolean(searchError)}
        helperText={searchError || " "}
        inputRef={inputElementRef}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
          }
        }}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="Искать"
                  onClick={handleSearch}
                  edge="end"
                >
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    </Paper>
  );
}

function MapOffice({
  offices,
  activeOfficeId,
  onOfficeClick,
  onOfficeContextMenu,
}: MapOfficeProps) {
  const mapInstanceRef = React.useRef<YMapLike | null>(null);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (!activeOfficeId) return;

    const office = offices.find((o) => o.id === activeOfficeId);
    if (!office) return;

    const coordinates = [office.latitude, office.longitude];

    mapInstanceRef.current.setCenter(coordinates, 14, {
      duration: 500,
    });
  }, [activeOfficeId, offices]);

  return (
    <YMaps
      query={{
        apikey: "1aba321e-4a90-4692-8d6e-7a20d8e6c5f8",
        load: "SuggestView,geocode",
      }}
    >
      <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
        <Map
          defaultState={{ center: [55.751244, 37.618423], zoom: 4 }}
          width="100%"
          height="100%"
          options={{ suppressMapOpenBlock: true }}
          instanceRef={(ref) => {
            mapInstanceRef.current = ref;
          }}
        >
          {offices.map((office) => {
            const isActive = office.id === activeOfficeId;
            return (
              <Placemark
                key={office.id}
                geometry={[office.latitude, office.longitude]}
                properties={{
                  balloonContent: office.name,
                  iconCaption: office.name,
                  hintContent: office.name,
                }}
                options={{
                  preset: "islands#dotIcon",
                  iconColor: isActive ? "#2F80ED" : "#c4c4c4",
                }}
                onClick={() => onOfficeClick(office.id)}
                onContextMenu={(event: unknown) => {
                  const yandexEvent = event as {
                    preventDefault?: () => void;
                    get?: (key: string) => {
                      preventDefault?: () => void;
                    };
                  };
                  yandexEvent.preventDefault?.();
                  yandexEvent.get?.("domEvent")?.preventDefault?.();
                  onOfficeContextMenu?.(office.id);
                }}
              />
            );
          })}
        </Map>
        <MapSearchOverlay mapRef={mapInstanceRef} />
      </Box>
    </YMaps>
  );
}

export default MapOffice;
