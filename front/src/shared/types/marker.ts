export type MarkerTypes = "workspace" | "room" | "emergency" | "utility";

export type MarkerPosition = {
  position_x: number;
  position_y: number;
};

export type MarkerRequest = {
  type: MarkerTypes;
  position: MarkerPosition;
};

export type MarkerResponse = {
  id: number;
  name?: string | null;
  type: MarkerTypes;
  position: MarkerPosition;
  pricePerHour?: number;
  uncomfortable?: boolean;
  photos?: { id: number; url: string }[];
  photoUrls?: string[];
  payload?: MarkerPayload;
};

export type MarkerPayload = {
  text?: string | null;
  capacity?: number | null;
  haveComputer?: boolean | null;
  description?: string | null;
  instruction?: string | null;
  [key: string]: unknown;
};

export type workspaceMarker = MarkerResponse & {
  uncomfortable: boolean;
  payload?: {
    haveComputer: boolean;
  };
};

export type RoomMarker = MarkerResponse & {
  payload?: {
    capacity: number;
  };
};

export type UtilityMarker = MarkerResponse & {
  payload?: {
    description: string;
  };
};

export type EmergencyMarker = MarkerResponse & {
  payload?: {
    instruction: string;
  };
};

export type Marker =
  | workspaceMarker
  | RoomMarker
  | UtilityMarker
  | EmergencyMarker;

export const markerColor: Record<MarkerTypes, string> = {
  workspace: "#3A7EFC",
  room: "#5EF821",
  emergency: "#B70000",
  utility: "#878B8D",
};

export const strokeColor: Record<MarkerTypes, string> = {
  workspace: "#0431AE",
  room: "#51AB2C",
  emergency: "#870000",
  utility: "#5D5E5E",
};
