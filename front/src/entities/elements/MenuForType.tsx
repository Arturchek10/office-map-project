import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import type { ReactNode } from "react";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import BuildIcon from "@mui/icons-material/Build";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { MarkerTypes } from "@shared/types/marker";

type PositionedMenuProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (type: MarkerTypes) => void;
};

const markerTypes: Array<{
  type: MarkerTypes;
  label: string;
  icon: ReactNode;
}> = [
  { type: "workspace", label: "Рабочее место", icon: <WorkOutlineIcon /> },
  { type: "room", label: "Переговорная", icon: <MeetingRoomIcon /> },
  { type: "utility", label: "Сервисная зона", icon: <BuildIcon /> },
  { type: "emergency", label: "Экстренная зона", icon: <WarningAmberIcon /> },
];

export default function PositionedMenu({
  open,
  onClose,
  onSelect,
}: PositionedMenuProps) {
  const handleSelect = (type: MarkerTypes) => {
    onSelect(type);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Тип точки</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1}>
          {markerTypes.map((item) => (
            <Button
              key={item.type}
              fullWidth
              variant="outlined"
              startIcon={item.icon}
              onClick={() => handleSelect(item.type)}
              sx={{ justifyContent: "flex-start" }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
