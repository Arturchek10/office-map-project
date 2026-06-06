export interface UserInfo {
  id: string
  email?: string
  name?: string
  role?: "SUPER_ADMIN" | "ADMIN" | "USER"
}
