import { BrowserRouter, Route, Routes } from "react-router-dom"
import HomePage from "@pages/HomePage"
import OfficeMapEditor from "@pages/OfficeMapEditor"
import AddFloor from "@pages/AddFloor"
import AuthPage from "@pages/AuthPage"
import RegisterPage from "@pages/RegisterPage"
import AdminPanelPage from "@pages/AdminPanelPage"
import MyBookingsPage from "@pages/MyBookingsPage"
import BookingDetailsPage from "@pages/BookingDetailsPage"
import { ProtectedRoute } from "@shared/components/ProtectedRoute"
import { initAuth, profileRefreshRequested } from "@shared/store/auth"
import { useEffect } from "react"
import { useUnit } from "effector-react"
import { ErrorSnackbar } from "@shared/ui/ErrorSnackbar"

function App() {
  const startAuth = useUnit(initAuth)
  const refreshProfile = useUnit(profileRefreshRequested)

  useEffect(() => {
    startAuth() // вызов эффекта при монтировании компонента
  }, [startAuth])

  useEffect(() => {
    const refreshOnFocus = () => refreshProfile()
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") {
        refreshProfile()
      }
    }

    window.addEventListener("focus", refreshOnFocus)
    document.addEventListener("visibilitychange", refreshOnVisible)

    return () => {
      window.removeEventListener("focus", refreshOnFocus)
      document.removeEventListener("visibilitychange", refreshOnVisible)
    }
  }, [refreshProfile])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/office/:officeId/floor/:floorId"
          element={
            <ProtectedRoute>
              <OfficeMapEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/office/:officeId/createfloor"
          element={
            <ProtectedRoute>
              <AddFloor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:bookingId"
          element={
            <ProtectedRoute>
              <BookingDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminpanel"
          element={
            <ProtectedRoute>
              <AdminPanelPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <ErrorSnackbar />
    </BrowserRouter>
  )
}

export default App
