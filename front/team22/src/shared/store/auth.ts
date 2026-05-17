import { createStore, createEvent, createEffect, sample } from "effector"
import { useUnit } from "effector-react"
import { signIn } from "@shared/api/Auth/SignIn"
import { refreshToken } from "@shared/api/Auth/RefreshToken"
import { isTokenExpired, getUserInfo } from "@shared/utils/jwt"
import { UserInfo } from "@shared/types/user.types"

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: UserInfo | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

// EVENTS
export const initAuth = createEvent()
export const loginRequested = createEvent<{ email: string; password: string }>()
export const logoutRequested = createEvent()
export const clearErrorRequested = createEvent()

// ключевой event для регистрации и восстановления
export const sessionRestored = createEvent<{
  token: string
  refreshToken: string
  user: UserInfo
}>()

// EFFECTS
export const loginFx = createEffect<
  { email: string; password: string },
  { token: string; refreshToken: string; user: UserInfo }
>(async (credentials) => {
  const response = await signIn(credentials)
  const user = getUserInfo(response.token)

  if (!user) throw new Error("Не удалось декодировать токен")

  return {
    token: response.token,
    refreshToken: response.refreshToken,
    user,
  }
})

export const restoreSessionFx = createEffect<void, AuthState>(async () => {
  const savedToken = localStorage.getItem("auth-token")
  const savedRefreshToken = localStorage.getItem("auth-refresh-token")
  const savedUser = localStorage.getItem("auth-user")

  if (!savedToken || !savedRefreshToken || !savedUser) {
    return { ...initialState, isLoading: false }
  }

  const parseUser = (raw: string): UserInfo | null => {
    try {
      return JSON.parse(raw) as UserInfo
    } catch {
      return null
    }
  }

  const user = parseUser(savedUser)

  if (!user) {
    localStorage.clear()
    return { ...initialState, isLoading: false }
  }

  // access token валиден
  if (!isTokenExpired(savedToken)) {
    return {
      token: savedToken,
      refreshToken: savedRefreshToken,
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    }
  }

  // refresh token жив
  if (!isTokenExpired(savedRefreshToken)) {
    const response = await refreshToken(savedRefreshToken)
    const newUser = getUserInfo(response.token)

    if (!newUser) throw new Error("Ошибка декодирования токена")

    return {
      token: response.token,
      refreshToken: response.refreshToken,
      user: newUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    }
  }

  localStorage.clear()

  return { ...initialState, isLoading: false }
})

// STORE
export const $auth = createStore<AuthState>(initialState)
  .on(loginFx.pending, (state, pending) => ({
    ...state,
    isLoading: pending,
    error: pending ? null : state.error,
  }))
  .on(loginFx.doneData, (_, data) => ({
    token: data.token,
    refreshToken: data.refreshToken,
    user: data.user,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  }))
  .on(loginFx.failData, (state, error) => ({
    ...state,
    isLoading: false,
    error: error.message || "Ошибка входа",
  }))
  .on(restoreSessionFx.pending, (state, pending) => ({
    ...state,
    isLoading: pending,
  }))
  .on(restoreSessionFx.doneData, (_, state) => state)
  .on(restoreSessionFx.failData, () => ({
    ...initialState,
    isLoading: false,
  }))
  .on(sessionRestored, (_, payload) => ({
    token: payload.token,
    refreshToken: payload.refreshToken,
    user: payload.user,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  }))
  .on(logoutRequested, () => ({
    ...initialState,
    isLoading: false,
  }))
  .on(clearErrorRequested, (state) => ({
    ...state,
    error: null,
  }))

export const $user = $auth.map((state) => state.user) 
// LOGIC
sample({
  clock: loginRequested,
  target: loginFx,
})

sample({
  clock: initAuth,
  target: restoreSessionFx,
})

// LOCAL STORAGE SYNC
$auth.watch((state) => {
  if (state.token && state.refreshToken && state.user) {
    localStorage.setItem("auth-token", state.token)
    localStorage.setItem("auth-refresh-token", state.refreshToken)
    localStorage.setItem("auth-user", JSON.stringify(state.user))
  } else {
    localStorage.removeItem("auth-token")
    localStorage.removeItem("auth-refresh-token")
    localStorage.removeItem("auth-user")
  }
})

// HOOK
export const useAuthStore = () => {
  const auth = useUnit($auth)

  return {
    ...auth,
    login: (email: string, password: string) =>
      loginRequested({ email, password }),
    logout: () => logoutRequested(),
    clearError: () => clearErrorRequested(),
  }
}