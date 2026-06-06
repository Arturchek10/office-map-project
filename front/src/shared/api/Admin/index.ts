import { apiGet, apiPatch, apiPost } from "@shared/utils/api";
import type {
  AdminOffice,
  AdminRequest,
  CursorResponse,
  UserBookings,
  UserListItem,
} from "@shared/types/admin";
import type { UserInfo } from "@shared/types/user.types";

const withCursorParams = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  return search.toString();
};

export const createAdminRequest = async (data: {
  email: string;
  phone?: string;
  comment?: string;
}): Promise<AdminRequest> => {
  const res = await apiPost("/api/v1/admin/requests", data);
  return res.json();
};

export const getMyAdminRequests = async (): Promise<AdminRequest[]> => {
  const res = await apiGet("/api/v1/admin/requests/my");
  return res.json();
};

export const getAdminRequests = async (params: {
  email?: string;
  cursor?: number | null;
  size?: number;
}): Promise<CursorResponse<AdminRequest>> => {
  const query = withCursorParams({
    email: params.email,
    cursor: params.cursor ?? undefined,
    size: params.size ?? 20,
  });
  const res = await apiGet(`/api/v1/admin/requests?${query}`);
  return res.json();
};

export const approveAdminRequest = async (requestId: number): Promise<AdminRequest> => {
  const res = await apiPatch(`/api/v1/admin/requests/${requestId}/approve`);
  return res.json();
};

export const rejectAdminRequest = async (
  requestId: number,
  reason?: string,
): Promise<AdminRequest> => {
  const res = await apiPatch(`/api/v1/admin/requests/${requestId}/reject`, {
    reason,
  });
  return res.json();
};

export const createAdmin = async (data: {
  email: string;
  name: string;
  password: string;
}): Promise<UserListItem> => {
  const res = await apiPost("/api/v1/admin/admins", data);
  return res.json();
};

export const getUsers = async (params: {
  email?: string;
  role?: UserInfo["role"];
  cursor?: number | null;
  size?: number;
}): Promise<CursorResponse<UserListItem>> => {
  const query = withCursorParams({
    email: params.email,
    role: params.role,
    cursor: params.cursor ?? undefined,
    size: params.size ?? 20,
  });
  const res = await apiGet(`/api/v1/admin/users?${query}`);
  return res.json();
};

export const getBannedUsers = async (params: {
  email?: string;
  cursor?: number | null;
  size?: number;
}): Promise<CursorResponse<UserListItem>> => {
  const query = withCursorParams({
    email: params.email,
    cursor: params.cursor ?? undefined,
    size: params.size ?? 20,
  });
  const res = await apiGet(`/api/v1/admin/users/banned?${query}`);
  return res.json();
};

export const changeUserRole = async (
  userId: number,
  role: "ADMIN" | "USER",
): Promise<UserListItem> => {
  const res = await apiPatch(`/api/v1/admin/users/${userId}/role`, { role });
  return res.json();
};

export const blockUser = async (
  userId: number,
  reason?: string,
): Promise<UserListItem> => {
  const res = await apiPost(`/api/v1/admin/users/${userId}/block`, { reason });
  return res.json();
};

export const unblockUser = async (userId: number): Promise<UserListItem> => {
  const res = await apiPost(`/api/v1/admin/users/${userId}/unblock`);
  return res.json();
};

export const blockAdminWithOffices = async (
  adminId: number,
  reason?: string,
): Promise<UserListItem> => {
  const res = await apiPost(`/api/v1/admin/admins/${adminId}/block-with-offices`, {
    reason,
  });
  return res.json();
};

export const unblockAdminWithOffices = async (
  adminId: number,
): Promise<UserListItem> => {
  const res = await apiPost(`/api/v1/admin/admins/${adminId}/unblock-with-offices`);
  return res.json();
};

export const getAdminOffices = async (params: {
  adminId: number;
  cursor?: number | null;
  size?: number;
}): Promise<CursorResponse<AdminOffice>> => {
  const query = withCursorParams({
    cursor: params.cursor ?? undefined,
    size: params.size ?? 20,
  });
  const res = await apiGet(`/api/v1/admin/admins/${params.adminId}/offices?${query}`);
  return res.json();
};

export const getMyAdminOffices = async (params: {
  cursor?: number | null;
  size?: number;
}): Promise<CursorResponse<AdminOffice>> => {
  const query = withCursorParams({
    cursor: params.cursor ?? undefined,
    size: params.size ?? 20,
  });
  const res = await apiGet(`/api/v1/admin/my/offices?${query}`);
  return res.json();
};

export const getUserBookingsByAdmin = async (userId: number): Promise<UserBookings> => {
  const res = await apiGet(`/api/v1/admin/users/${userId}/bookings`);
  return res.json();
};

export const getOfficeBookingsByAdmin = async (officeId: number): Promise<UserBookings> => {
  const res = await apiGet(`/api/v1/admin/offices/${officeId}/bookings`);
  return res.json();
};
