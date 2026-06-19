import { Box, Typography, Tooltip } from "@mui/material";
import { getImageUrl } from "@shared/utils/getImageUrl";

interface FurnitureProps {
  name: string;
  photoUrl: string;
  onClick?: () => void;
}

function Furniture({ name, photoUrl, onClick }: FurnitureProps) {

  const imageSrc = getImageUrl(photoUrl)
  return (
    <Tooltip title={name} arrow placement="top">
      <Box
        onClick={onClick}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: 70,
          height: 70,
          padding: 1,
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: "#2F80ED",
            backgroundColor: "#f8fbff",
            transform: "scale(1.08)",
          },
          "&:active": {
            transform: "scale(0.95)",
          },
        }}
      >
        <Box
          component="img"
          src={imageSrc}
          alt={name}
          sx={{
            width: 48,
            height: 48,
            objectFit: "contain",
            mb: 1,
          }}
        />
      </Box>
    </Tooltip>
  );
}

export default Furniture;