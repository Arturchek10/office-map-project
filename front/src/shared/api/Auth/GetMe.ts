import type { UserInfo } from "@shared/types/user.types";

export const getMe = async (token: string): Promise<UserInfo> => {
  const response = await fetch("/api/v1/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text().catch(() => "");
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      data && typeof data.message === "string"
        ? data.message
        : `HTTP error ${response.status}`;
    throw new Error(message);
  }

  return data as UserInfo;
};
