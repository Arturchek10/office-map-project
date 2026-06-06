import { ErrorResponse } from "react-router-dom";

interface SignInRequest {
  email: string;
  password: string;
}

interface SignInResponse {
  token: string;
  refreshToken: string;
}

export const signIn = async (
  credentials: SignInRequest,
): Promise<SignInResponse> => {
  // Для тестирования - мок ответ
  if (credentials.email === "test1" && credentials.password === "test1") {
    const mockResponse: SignInResponse = {
      token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
      refreshToken: "mock-refresh-token",
    };
    return mockResponse;
  }

  try {
    const response = await fetch("/api/v1/auth/sign-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data: SignInResponse | ErrorResponse = await response.json()

    if (!response.ok) {
      const message =
        "message" in data && typeof data.message === "string"
          ? data.message
          : "Ошибка входа"

      throw new Error(message)
    }
    console.log("Sign In!");
    return data as SignInResponse;
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
};
