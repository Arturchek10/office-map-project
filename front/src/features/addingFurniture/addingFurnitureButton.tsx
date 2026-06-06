import { forwardRef } from "react"
import { Button } from "@mui/material"

interface AddingFurnitureButtonProps {
  onClick: () => void
  isPanelOpen: boolean
}

const AddingFurnitureButton = forwardRef<HTMLButtonElement, AddingFurnitureButtonProps>(
  function AddingFurnitureButton({ onClick, isPanelOpen}, ref) {
    return (
      <Button
        ref={ref}
        variant="contained"
        onClick={onClick}
      >
        {!isPanelOpen ? "Добавить мебель" : "Закрыть панель"}
      </Button>
    )
  }
)

export default AddingFurnitureButton
