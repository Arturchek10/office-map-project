import { Snackbar, Alert } from "@mui/material"
import { useUnit } from "effector-react"
import { $officeError } from "@shared/store/office"
import { useState, useEffect } from "react"

export const ErrorSnackbar = () => {
  const error = useUnit($officeError)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (error) {
      setOpen(true)
      console.log("ERROR STORE", error);
    }
  }, [error])

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert severity="error" onClose={handleClose} variant="filled">
        {error}
      </Alert>
    </Snackbar>
  )
}