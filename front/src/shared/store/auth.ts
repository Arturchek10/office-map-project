import { getMe } from "@shared/api/Auth/GetMe";
import { refreshToken } from "@shared/api/Auth/RefreshToken";
import { signIn } from "@shared/api/Auth/SignIn";
import { UserInfo } from "@shared/types/user.types";
import { isTokenExpired } from "@shared/utils/jwt";
import { createEffect, createEvent, createStore, sample } from "effector";
import { useUnit } from "effector-react";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const initAuth = createEvent();
export const profileRefreshRequested = createEvent();
export const loginRequested = createEvent<{ email: string; password: string }>();
export const logoutRequested = createEvent();
export const clearErrorRequested = createEvent();
export const tokensRefreshed = createEvent<{
  token: string;
  refreshToken: string;
  user: UserInfo;
}>();
export const sessionRestored = createEvent<{
  token: string;
  refreshToken: string;
  user: UserInfo;
}>();

export const loginFx = createEffect<
  { email: string; password: string },
  { token: string; refreshToken: string; user: UserInfo }
>(async (credentials) => {
  const response = await signIn(credentials);
  const user = await getMe(response.token);

  return {
    token: response.token,
    refreshToken: response.refreshToken,
    user,
  };
});

export const restoreSessionFx = createEffect<void, AuthState>(async () => {
  const savedToken = localStorage.getItem("auth-token");
  const savedRefreshToken = localStorage.getItem("auth-refresh-token");

  if (!savedToken || !savedRefreshToken) {
    return { ...initialState, isLoading: false };
  }

  if (!isTokenExpired(savedToken)) {
    const user = await getMe(savedToken);

    return {
      token: savedToken,
      refreshToken: savedRefreshToken,
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    };
  }

  if (!isTokenExpired(savedRefreshToken)) {
    const response = await refreshToken(savedRefreshToken);
    const user = await getMe(response.token);

    return {
      token: response.token,
      refreshToken: response.refreshToken,
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    };
  }

  localStorage.removeItem("auth-token");
  localStorage.removeItem("auth-refresh-token");
  localStorage.removeItem("auth-user");

  return { ...initialState, isLoading: false };
});

export const refreshProfileFx = createEffect<
  void,
  { token: string; refreshToken: string; user: UserInfo }
>(async () => {
  const savedToken = localStorage.getItem("auth-token");
  const savedRefreshToken = localStorage.getItem("auth-refresh-token");

  if (!savedToken || !savedRefreshToken) {
    throw new Error("Пользователь не авторизован");
  }

  if (!isTokenExpired(savedToken)) {
    return {
      token: savedToken,
      refreshToken: savedRefreshToken,
      user: await getMe(savedToken),
    };
  }

  if (!isTokenExpired(savedRefreshToken)) {
    const response = await refreshToken(savedRefreshToken);

    return {
      token: response.token,
      refreshToken: response.refreshToken,
      user: await getMe(response.token),
    };
  }

  throw new Error("Сессия истекла");
});

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
  .on(refreshProfileFx.doneData, (state, payload) => ({
    ...state,
    token: payload.token,
    refreshToken: payload.refreshToken,
    user: payload.user,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  }))
  .on(refreshProfileFx.failData, () => ({
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
  .on(tokensRefreshed, (state, payload) => ({
    ...state,
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
  }));

export const $user = $auth.map((state) => state.user);

sample({
  clock: loginRequested,
  target: loginFx,
});

sample({
  clock: initAuth,
  target: restoreSessionFx,
});

sample({
  clock: profileRefreshRequested,
  target: refreshProfileFx,
});

$auth.updates.watch((state) => {
  if (state.isLoading) return;

  if (state.token && state.refreshToken && state.user) {
    localStorage.setItem("auth-token", state.token);
    localStorage.setItem("auth-refresh-token", state.refreshToken);
    localStorage.setItem("auth-user", JSON.stringify(state.user));
    return;
  }

  localStorage.removeItem("auth-token");
  localStorage.removeItem("auth-refresh-token");
  localStorage.removeItem("auth-user");
});

export const useAuthStore = () => {
  const auth = useUnit($auth);

  return {
    ...auth,
    login: (email: string, password: string) =>
      loginRequested({ email, password }),
    logout: () => logoutRequested(),
    clearError: () => clearErrorRequested(),
  };
};
