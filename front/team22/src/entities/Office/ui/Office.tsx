import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import CardMedia from "@mui/material/CardMedia"
import Typography from "@mui/material/Typography"
import CardActionArea from "@mui/material/CardActionArea"
import type { TOffice } from "../type/office"

interface OfficeProps extends TOffice {
  active?: boolean
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
  active = false, // выделена ли карточка оффиса или нет. Синий фон если выделена
}: OfficeProps) {
  return (
    <Card
      sx={{
        maxWidth: 250,
        bgcolor: active ? "rgba(47, 128, 237, 0.3) !important" : "white",
        transition: "background-color 0.3s ease, border-color 0.3s ease",
      }}
      elevation={active ? 8 : 1}
    >
      <CardActionArea>
        <CardMedia component="img" height="120" image={getImageUrl(photoUrl)} alt={name} />
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
