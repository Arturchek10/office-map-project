interface RefreshTokenRequest {
  refreshToken: string
}

interface RefreshTokenResponse {
  token: string
  refreshToken: string
}

export const refreshToken = async (
  refreshToken: string
): Promise<RefreshTokenResponse> => {
  try {
    const response = await fetch("/api/v1/token/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`
      )
    }

    const data: RefreshTokenResponse = await response.json()
    return data
  } catch (error) {
    console.error("Refresh token error:", error)
    throw error
  }
}
