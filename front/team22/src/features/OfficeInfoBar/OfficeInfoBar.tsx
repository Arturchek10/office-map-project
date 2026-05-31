import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Button,
  Modal,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { $activeOffice } from "@shared/api/Offices/GetOfficeById";
import { useUnit } from "effector-react";
import { useEffect, useState } from "react";
import { fetchOfficeByIdFx } from "@shared/api/Offices/GetOfficeById";
import CloseIcon from "@mui/icons-material/Close";
import { TOffice } from "@entities/Office/type/office";

interface OfficeInfoBarProps {
  open: boolean;
  activeOfficeId: number | null;
  activeOffice: TOffice | null;
  onClose: () => void;
}

export default function OfficeInfoBar({
  open,
  activeOfficeId,
  activeOffice,
  onClose,
}: OfficeInfoBarProps) {
  const navigate = useNavigate();
  const office = useUnit($activeOffice);

  const [imageModalOpen, setImageModalOpen] = useState(false);

  const getImageUrl = (path?: string | null) => {
    if (!path) return "/placeholder-office-png";
    if (path.startsWith("http")) return path;
    return `http://localhost:8080${path}`;
  };

  useEffect(() => {
    if (!open || !activeOfficeId) {
      return
    }
    fetchOfficeByIdFx(activeOfficeId);
  }, [open, activeOfficeId]);

  if (!office) {
    return (
      <Drawer open={open} onClose={onClose}>
        <Typography>Загрузка...</Typography>
      </Drawer>
    );
  }

  const imageUrl = getImageUrl(activeOffice?.photoUrl);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: 380,
          p: 3,
          boxShadow: "-8px 0 25px rgba(0,0,0,0.12)",
        },
      }}
    >
      {/* Кликабельное изображение */}
      <Box
        sx={{
          width: "100%",
          height: 340,
          borderRadius: 3,
          mt: 6,
          overflow: "hidden",
          backgroundColor: "#f5f7fa",
          cursor: "pointer",           // ← важно!
          mb: 3,
          transition: "transform 0.2s ease",
          "&:hover": {
            transform: "scale(1.02)",
          },
        }}
        onClick={() => setImageModalOpen(true)}
      >
        <img
          src={imageUrl}
          alt={office.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center bottom",
          }}
        />
      </Box>

      {/* ... остальной контент ... */}

      <Typography variant="h5" fontWeight={700} gutterBottom>
        {office.name}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        Этажей: {office.floors.length}
      </Typography>

      <Button
        variant="contained"
        fullWidth
        sx={{ mt: 3 }}
        onClick={() => {
          if (!office?.startFloor?.id) {
            navigate(`/office/${office.id}/createfloor`)
          }
          navigate(`/office/${office.id}/floor/${office.startFloor.id}`);
          onClose();
        }}
      >
        Открыть офис на карте
      </Button>

      {/* ====================== МОДАЛЬНОЕ ОКНО ====================== */}
      <Modal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mt: 6 ,
          bgcolor: "rgba(0,0,0,0.9)",
        }}
      >
        <Box
          sx={{
            position: "relative",
            maxWidth: "95%",
            maxHeight: "95%",
            outline: "none",
          }}
        >
          <IconButton
            onClick={() => setImageModalOpen(false)}
            sx={{
              position: "absolute",
              top: -50,
              right: 0,
              color: "white",
              bgcolor: "rgba(0,0,0,0.5)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
            }}
          >
            <CloseIcon />
          </IconButton>

          <img
            src={imageUrl}
            alt={office.name}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: 8,
            }}
          />
        </Box>
      </Modal>
    </Drawer>
  );
}