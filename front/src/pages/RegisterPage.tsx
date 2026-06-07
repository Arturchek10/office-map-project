import {
  CssBaseline,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
} from "@mui/material"
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import T1logo from "@entities/Header/assets/T1 logo blue.svg?react";
import { register } from "@shared/api/Auth/Register";
import {jwtDecode} from "jwt-decode";
import {sessionRestored} from "@shared/store/auth";
import { useUnit } from "effector-react";
import type { ChangeEvent, FormEvent } from "react";
import type { UserInfo } from "@shared/types/user.types";
import { parseUserRole } from "@shared/utils/jwt";

interface JwtPayload {
  sub: string
  email?: string
  name?: string
  role?: string
  exp: number
  iat: number
}

function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const applySession = useUnit(sessionRestored)

  // функция для декодирования токена и получения информации о пользователе для сохранения в локальном хранилище
  const getUserInfo = (token: string): UserInfo => {
    const payload = jwtDecode<JwtPayload>(token)
    return {
      id: payload.sub,
      email: payload.email ?? "",
      name: payload.name ?? "",
      role: parseUserRole(payload.role)
    }
  }

  const handleInputChange =
    (field: string) => (event: ChangeEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
        [field]: event.target.value,
      })
      // Очищаем ошибки при изменении полей
      if (error) setError("")
      if (success) setSuccess("")
    }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.confirmPassword.trim() ||
      !formData.name
    ) {
      setError("Пожалуйста, заполните все поля")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // успешная регистрация
      // сохраняем данные токенов в хранилище чтобы можно было сразу авторизоваться и также данные о пользователе
      const response = await register({
        email: formData.email,
        name: formData.name,
        password: formData.password,
      })
      setSuccess("Успешно. Ожидайте перехода на главную страницу")
      const userInfo = getUserInfo(response.token)
      
      applySession({
        token: response.token,
        refreshToken: response.refreshToken,
        user: userInfo,
      })
      
      setTimeout(() => {
        navigate('/')
      }, 1000)

      // Очищаем форму после успешной регистрации
      setFormData({ email: "", name: "", password: "", confirmPassword: "" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при регистрации")
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <>
      <Box sx={{ display: "flex", height: "100vh" }}>
        <CssBaseline />
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
            sx={{ p: 4, borderRadius: 3, minWidth: 500, textAlign: "center" }}
          >
            <Typography variant="h4" sx={{mb:3}}>
              Регистрация
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="email"
                  fullWidth
                  size="small"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  disabled={isLoading}
                />
                <TextField
                  label="name"
                  fullWidth
                  size="small"
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  disabled={isLoading}
                />
                <TextField
                  label="password"
                  type="password"
                  fullWidth
                  size="small"
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  disabled={isLoading}
                />
                <TextField
                  label="confirm password"
                  type="password"
                  fullWidth
                  size="small"
                  value={formData.confirmPassword}
                  onChange={handleInputChange("confirmPassword")}
                  disabled={isLoading}
                  error={
                    Boolean(formData.confirmPassword) &&
                    formData.password !== formData.confirmPassword
                  }
                  helperText={
                    formData.confirmPassword &&
                    formData.password !== formData.confirmPassword
                      ? "Пароли не совпадают"
                      : " "
                  }
                />

                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={
                    isLoading ||
                    (Boolean(formData.confirmPassword) &&
                      formData.password !== formData.confirmPassword)
                  }
                  fullWidth
                >
                  {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>

                <Button
                  variant="text"
                  onClick={() => navigate("/auth")}
                  disabled={isLoading}
                >
                  Уже есть аккаунт? Войти
                </Button>
              </Stack>
            </form>
          </Paper>
        </Box>
      </Box>
    </>
  )
}

export default RegisterPage
