import { Button } from "@mui/material";
import { useUnit } from "effector-react";
import { useNavigate } from "react-router-dom";
import { $activeOffice } from "@shared/api/Offices/GetOfficeById";

export default function AddFloorButton() {
  const nav = useNavigate()
  const activeOffice = useUnit($activeOffice)
  const id = activeOffice?.id

  return (
    <Button variant="contained" onClick={() => nav(`/office/${id}/createfloor`)}>Создать новый этаж</Button>
  );
}
