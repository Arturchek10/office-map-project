export type AuthUser = {
  sub: string;
  email?: string;
  name?: string;
  role?: string;
  iat?: number;
  exp?: number;
};
