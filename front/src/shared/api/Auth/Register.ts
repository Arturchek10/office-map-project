import { fetchJsonSafe } from "@shared/utils/fetchJsonSafe"

interface RegisterRequest {
  email: string
  name: string
  password: string
}

interface RegisterResponse {
  token: string,
  refreshToken: string
}

interface ErrorResponse {
  status: number
  message: string
  timestamp: string
  path: string
  subErrors: any[]
}

export const register = async (
  credentials: RegisterRequest
): Promise<RegisterResponse> => {
  try {
    const response = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    const data = await fetchJsonSafe(response)

    if (!response.ok) {
      // Если есть JSON с ошибкой, используем его
      if (data && typeof data === "object" && "message" in data) {
        const errorData = data as ErrorResponse
        throw new Error(errorData.message || "Validation failed")
      }

      // Если нет JSON или нет сообщения об ошибке, создаем стандартную ошибку
      if (response.status === 400) {
        throw new Error("Validation failed")
      }

      throw new Error(`Ошибка регистрации: ${response.status}`)
    }

    // Успешный ответ 201 - возвращаем пустой объект
    return data as RegisterResponse;
  } catch (error) {
    console.error("Register error:", error)
    throw error
  }
}
