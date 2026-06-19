import Header from "@entities/Header/Header"
import { CssBaseline, Box, CircularProgress, Typography } from "@mui/material"
import NavBar from "@entities/NavBar/NavBar"
import OfficesBar from "@features/OfficesBar/OfficesBar"
import { useState, useEffect, useRef } from "react"
import { useUnit } from "effector-react"
import { useParams } from "react-router-dom"
import {
  $offices,
  $officesError,
  $officesLoading,
} from "@shared/api/Offices/GetOfficesList"
import OfficeMap from "@entities/OfficeMap/OfficeMap"
import { $activeOffice } from "@shared/api/Offices/GetOfficeById"
import { getFurnitureCatalogFx } from "@shared/api/Furniture/GetFurnitureCatalog"
import { fetchOfficeByIdFx } from "@shared/api/Offices/GetOfficeById"
import { getFloorByIdFx } from "@shared/store/dataFromFloor"
import { fetchOfficesFx } from "@shared/api/Offices/GetOfficesList"

function OfficeMapEditor() {
  const { officeId, floorId } = useParams<{
    officeId: string
    floorId: string
  }>()

  // Ref для отслеживания инициированных пользователем переходов
  const userInitiatedNavigation = useRef(false)

  useEffect(() => {
    // Если переход был инициирован пользователем, не делаем повторные запросы
    if (userInitiatedNavigation.current) {
      userInitiatedNavigation.current = false
      return
    }

    if (officeId && floorId) {
      fetchOfficeByIdFx(+officeId)
      getFloorByIdFx(+floorId)
      fetchOfficesFx()
    }
  }, [officeId, floorId])

  const [isOfficesBarOpen, setIsOfficesBarOpen] = useState(false)
  const toggleOfficesBar = () => {
    setIsOfficesBarOpen((prev) => !prev)
  }

  const [offices, loading, error] = useUnit([
    $offices,
    $officesLoading,
    $officesError,
  ])

  const activeOffice = useUnit($activeOffice)

  useEffect(() => {
    getFurnitureCatalogFx()
  }, [])

  if (error) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 2,
        }}
      >
        <Typography variant="h3" align="center" color="error">
          Ошибка загрузки офисов: {error?.message || "Неизвестная ошибка"}
        </Typography>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress size={80} />
      </Box>
    )
  }

  return (
    <>
      <Header officeName={activeOffice?.name} />
      <OfficeMap />
      <Box sx={{ display: "flex", height: "100vh" }}>
        <CssBaseline />
        <NavBar onToggleOffices={toggleOfficesBar} />

        <OfficesBar
          offices={offices}
          open={isOfficesBarOpen}
          activeOfficeId={activeOffice?.id}
          onUserNavigation={() => {
            userInitiatedNavigation.current = true
          }}
        />
      </Box>
    </>
  )
}

export default OfficeMapEditor
