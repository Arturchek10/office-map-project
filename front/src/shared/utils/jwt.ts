// На стороне клиента реализована декодировка JWT-токена для извлечения 
// пользовательских данных и проверки срока его действия без необходимости 
// дополнительных запросов к серверу.


// утилита для работы с JSON Web Token
// - декодирует токен
// - проверяет, истёк ли он
// - достаёт данные пользователя
// пример jwt xxxxx.yyyyy.zzzzz - header.payload.signature

import { UserInfo } from "@shared/types/user.types"

const roles: Array<NonNullable<UserInfo["role"]>> = ["SUPER_ADMIN", "ADMIN", "USER"]

export const parseUserRole = (role?: string): UserInfo["role"] =>
  roles.includes(role as NonNullable<UserInfo["role"]>)
    ? (role as NonNullable<UserInfo["role"]>)
    : undefined

interface JwtPayload {
  sub: string
  email?: string
  name?: string
  role?: string
  exp: number
  iat: number
}

export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const parts = token.split(".")

    if (parts.length !== 3) {
      return null
    }

    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )

    const result = JSON.parse(jsonPayload)
    return result
  } catch (error) {
    console.error("Error decoding JWT:", error)
    return null
  }
}

// проверка:  токен истек или нет
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwt(token)
  if (!payload) return true

  const currentTime = Math.floor(Date.now() / 1000)
  return payload.exp < currentTime
}

// получение информации о пользователе через токен 
export const getUserInfo = (token: string): UserInfo | null => {
  const payload = decodeJwt(token)
  if (!payload) return null

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: parseUserRole(payload.role),
  }
}
