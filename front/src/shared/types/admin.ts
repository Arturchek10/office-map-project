import type { Booking } from "@shared/api/Bookings";
import type { UserInfo } from "./user.types";

export type CursorResponse<T> = {
  items: T[];
  nextCursor: number | null;
  hasMore: boolean;
};

export type AdminRequest = {
  id: number;
  userId: number;
  email: string;
  phone: string | null;
  comment: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt: string | null;
};

export type UserListItem = {
  id: number;
  email: string;
  name: string;
  role: NonNullable<UserInfo["role"]>;
  bannedAt: string | null;
  bannedReason: string | null;
};

export type AdminOffice = {
  id: number;
  name: string | null;
  address: string | null;
  city: string | null;
  deletedAt: string | null;
  floorsCount: number;
};

export type UserBookings = Booking[];

export type PendingUser = UserListItem;

export type PendingUsersResponse = {
  content: PendingUser[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};
