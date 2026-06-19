import {Fab, Tooltip} from "@mui/material"
import AddIcon from "@mui/icons-material/Add" 


type AddMarkerBtnProps = {
  handleAddMarker: (event: React.MouseEvent<HTMLElement>) => void
}

export default function AddMarkerBtn({handleAddMarker}: AddMarkerBtnProps){
  return (
    <>
      <Tooltip title="добавить маркер" placement="right">
        <Fab style={{backgroundColor: "#fff", color: "#1565C0" }} aria-label="add" onClick={handleAddMarker} >
          <AddIcon />
        </Fab>
      </Tooltip>
    </>
  )
}