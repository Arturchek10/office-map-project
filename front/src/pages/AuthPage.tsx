import {
  CssBaseline,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import T1logo from "@entities/Header/assets/T1 logo blue.svg?react"
import { useAuthStore } from "@shared/store/auth"
import { useUnit } from "effector-react"

function AuthPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, isAuthenticated, clearError } =
    useAuthStore()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Перенаправляем на главную страницу, если пользователь уже авторизован
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/")
    }
  }, [isAuthenticated, isLoading, navigate])

  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }))
      // Очищаем ошибку при изменении полей
      if (error) {
        clearError()
      }
    }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.email || !formData.password) {
      return 
    }

    login(formData.email, formData.password)
  }

  return (
    <>
      <Box sx={{ display: "flex", height: "100vh", position: "relative" }}>
        <CssBaseline />

        {/* Лого справа сверху */}
        <Box
          sx={{
            position: "absolute",
            top: 40,
            right: 40,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <T1logo style={{ width: 100, height: 50, color: "#2F80ED" }} />
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: "#2F80ED" }}
          >
            Office Map
          </Typography>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "#f5f5f5",
          }}
        >
          <Paper
            elevation={3}
            sx={{ p: 4, borderRadius: 3, minWidth: 400, textAlign: "center" }}
          >
            <Typography variant="h4" gutterBottom>
              Вход
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error} 
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Логин"
                  fullWidth
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  disabled={isLoading}
                  required
                />
                <TextField
                  label="Пароль"
                  type="password"
                  fullWidth
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  disabled={isLoading}
                  required
                />

                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={isLoading || !formData.email || !formData.password}
                  sx={{ position: "relative" }}
                >
                  {isLoading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Вход...
                    </>
                  ) : (
                    "Войти"
                  )}
                </Button>

                <Button
                  variant="text"
                  color="primary"
                  onClick={() => navigate("/register")}
                  disabled={isLoading}
                >
                  Регистрация
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Box>
      </Box>
    </>
  )
}

export default AuthPage
