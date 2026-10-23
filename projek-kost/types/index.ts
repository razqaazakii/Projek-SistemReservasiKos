// types/index.ts
// Re-export type definitions with explicit naming to avoid ambiguity

export type {
  RoomType,
  Room,
  BookingFormData,
  BookingFormErrors,
} from './room';

export type {
  Tenant,
  Room as DashboardRoom,
} from './dashboard';
