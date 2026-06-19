import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import CardMedia from "@mui/material/CardMedia"
import Typography from "@mui/material/Typography"
import CardActionArea from "@mui/material/CardActionArea"
import { Box, Chip } from "@mui/material"
import type { TOffice } from "../type/office"

interface OfficeProps extends TOffice {
  active?: boolean
  isNoFloors: boolean
}

const getImageUrl = (path?: string | null) => {
  if (!path) return '/placeholder-office-png'
  if (path.startsWith('http')) return path
  // console.log(path)
  return `http://localhost:8080${path}`
}

function Office({
  photoUrl,
  name,
  city,
  address,
  floorsCount,
  isNoFloors,
  active = false, // выделена ли карточка оффиса или нет. Синий фон если выделена
}: OfficeProps) {
  
  // const isNoFloors = floorsCount === 0 || floorsCount === null || floorsCount === undefined;

  return (
    <Card
      sx={{
        maxWidth: 250,
        bgcolor: active ? "rgba(47, 128, 237, 0.3) !important" : "white",
        transition: "background-color 0.3s ease, border-color 0.3s ease",
        position: "relative",
        overflow: "visible",
      }}
      elevation={active ? 8 : 1}
    >
      <CardActionArea>
        <Box sx={{ position: "relative" }}>
          <CardMedia
            component="img"
            height="140"
            image={getImageUrl(photoUrl)}
            alt={name}
            sx={{ borderRadius: "4px 4px 0 0" }}
          />

          {/* Плашка в правом верхнем углу */}
          <Box sx={{ position: "absolute", top: 12, right: 12 }}>
            <Chip
              label={
                isNoFloors
                  ? "нет этажей"
                  : `${floorsCount} ${floorsCount === 1 ? "этаж" : floorsCount < 5 ? "этажа" : "этажей"}`
              }
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: "0.75rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                bgcolor: isNoFloors 
                  ? "#d32f2f" 
                  : "#424242",
                color: "white",
                "&:hover": {
                  bgcolor: isNoFloors 
                    ? "#b71c1c" 
                    : "#212121",
                },
              }}
            />
          </Box>
        </Box>

        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {city}, {address}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export default Office
