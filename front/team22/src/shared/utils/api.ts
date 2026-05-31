// обёртка над fetch, которая:

// - автоматически подставляет токен (Authorization)
// - обрабатывает ошибки
// - делает refresh токена при 401
// - повторяет запрос после обновления токена
// - даёт удобные методы (apiGet, apiPost и т.д.)

//  это единый HTTP-клиент для всего проекта

import {
  $auth,
  logoutRequested,
} from "@shared/store/auth";
import { refreshToken } from "@shared/api/Auth/RefreshToken";

let isRefreshing = false;
// Очередь запросов
// Если несколько запросов одновременно получили 401:

// только один делает refresh
// остальные ждут в очереди
// потом все продолжаются
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Все запросы идут через эту функцию
export const createApiRequest = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  // Подстановка токена
  const authState = $auth.getState();
  const token = authState.token || localStorage.getItem("auth-token");
  const refreshTokenValue =
    authState.refreshToken || localStorage.getItem("auth-refresh-token");
  // console.log("token :", token);
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Универсальный fetch. Любая ошибка попадает в exception и выводится.
  const fetchWithCheck = async (customHeaders: Record<string, string>,): Promise<Response> => {
    const res = await fetch(url, { ...options, headers: customHeaders });
    // console.log("REQUEST:", {
    //   url,
    //   method: options.method,
    //   headers: customHeaders
    // } )
    if (!res.ok) {
      const text = await res.text().catch(() => "");

      let message = `Ошибка ${res.status}`;

      try {
        const data = JSON.parse(text);
        message = data.message || message;

      } catch {
        if (text) {
          message = text;
        }
      }

      throw new Error(message);
    }
    return res;
  };

  try {
    return await fetchWithCheck(headers);
  } catch (err: any) {
    // Обработка 401
    // Если 401 и есть refreshToken
    // Если токен истёк:
    // Проверяет "Token expired"
    // Запускает refresh токена
    // Обновляет store
    // Повторяет запрос
    if (err.message.includes("HTTP 401") && refreshTokenValue) {
      const errorData = await fetch(url, { ...options, headers }).then((r) =>
        r.json().catch(() => ({})),
      );

      //
      if (errorData.message === "Token expired") {
        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((newToken) => {
            const newHeaders = {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            };
            return fetchWithCheck(newHeaders);
          });
        }

        isRefreshing = true;
        try {
          const newTokens = await refreshToken(refreshTokenValue);
          // refreshTokensRequested({
          //   token: newTokens.token,
          //   refreshToken: newTokens.refreshToken,
          // });

          const newHeaders = {
            ...headers,
            Authorization: `Bearer ${newTokens.token}`,
          };

          const retryResponse = await fetchWithCheck(newHeaders);
          processQueue(null, newTokens.token);
          isRefreshing = false;
          return retryResponse;
        } catch (refreshError) {
          processQueue(refreshError as Error);
          isRefreshing = false;
          // Если refresh не удался пользователь разлогинивается
          logoutRequested();
          throw new Error("Token refresh failed");
        }
      }
    }

    throw err;
  }
};

// --- вспомогательные функции ---
// Чтобы не писать каждый раз:
// fetch(url, { method: "POST", body: ... }) а можно сразу apiPost("/users", data)
export const apiGet = (url: string, options?: RequestInit) =>
  createApiRequest(url, { ...options, method: "GET" });

export const apiPost = (url: string, data?: any, options?: RequestInit) =>
  createApiRequest(url, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPut = (url: string, data?: any, options?: RequestInit) =>
  createApiRequest(url, {
    ...options,
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPatch = (url: string, data?: any, options?: RequestInit) =>
  createApiRequest(url, {
    ...options,
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPatchFormData = (
  url: string,
  formData: FormData,
  options?: RequestInit,
) =>
  createApiRequest(url, {
    ...options,
    method: "PATCH",
    body: formData,
    headers: { ...options?.headers },
  });

export const apiDelete = (url: string, options?: RequestInit) =>
  createApiRequest(url, { ...options, method: "DELETE" });

export const apiPostFormData = (
  url: string,
  formData: FormData,
  options?: RequestInit,
) =>
  createApiRequest(url, {
    ...options,
    method: "POST",
    body: formData,
    headers: {
      ...options?.headers,
    },
  });
