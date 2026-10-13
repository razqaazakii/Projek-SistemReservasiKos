// app/dashboard/layout.tsx
// Layout untuk semua halaman di bawah /dashboard
// Membungkus DashboardProvider agar context tersedia di semua sub-halaman

import { DashboardProvider } from "@/lib/dashboardContext";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardProvider>{children}</DashboardProvider>;
}
