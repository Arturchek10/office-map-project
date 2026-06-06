import { ReactNode, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@shared/store/auth"

interface ProtectedRouteProps {
  children: ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth")
    }
  }, [isAuthenticated, isLoading, navigate])

  // Показываем загрузку, пока проверяем аутентификацию
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Загрузка...</div>
      </div>
    )
  }

  // Если не авторизован, не показываем содержимое
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
