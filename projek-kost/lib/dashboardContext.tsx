"use client";

// ============================================================
// lib/dashboardContext.tsx
// Context global untuk manajemen data Dashboard (Penyewa & Kamar)
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Tenant, Room } from "@/types/dashboard";

// ── Helper format Rupiah ────────────────────────────────────
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ── Tipe Context ────────────────────────────────────────────
interface DashboardContextValue {
  tenants: Tenant[];
  rooms: Room[];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  addTenant: (tenant: Omit<Tenant, "id">) => void;
  updateTenant: (tenant: Tenant) => void;
  checkoutTenant: (id: string) => void;
  moveTenantRoom: (tenantId: string, newRoomId: string) => void;
  addDiscount: (tenantId: string, amount: number) => void;
}

// ── Data awal (seed) ─────────────────────────────────────────
const INITIAL_ROOMS: Room[] = [
  { id: "r1", number: "101", type: "Standar", price: 800000, status: "Terisi", floor: 1 },
  { id: "r2", number: "102", type: "Standar", price: 800000, status: "Tersedia", floor: 1 },
  { id: "r3", number: "201", type: "Deluxe", price: 1200000, status: "Terisi", floor: 2 },
  { id: "r4", number: "202", type: "Deluxe", price: 1200000, status: "Tersedia", floor: 2 },
  { id: "r5", number: "301", type: "VIP", price: 1800000, status: "Tersedia", floor: 3 },
];

const INITIAL_TENANTS: Tenant[] = [
  {
    id: "t1",
    nama: "Andi Pratama",
    nik: "3171012904990001",
    roomId: "r1",
    roomNumber: "101",
    phone: "081234567890",
    tanggalMasuk: "2025-01-01",
    biayaSewa: 800000,
    deposit: 800000,
    statusBayar: "Lunas",
    jatuhTempo: "2025-02-01",
    ktpImage: "",
    catatan: "",
  },
  {
    id: "t2",
    nama: "Siti Rahayu",
    nik: "3171019805000002",
    roomId: "r3",
    roomNumber: "201",
    phone: "087654321098",
    tanggalMasuk: "2025-01-15",
    biayaSewa: 1200000,
    deposit: 1200000,
    statusBayar: "Belum Bayar",
    jatuhTempo: "2025-02-15",
    ktpImage: "",
    catatan: "Mahasiswi semester 5",
  },
];

// ── Context ─────────────────────────────────────────────────
const DashboardContext = createContext<DashboardContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = useCallback(() => setIsDarkMode((v) => !v), []);

  // Tambah penyewa baru → set kamar jadi Terisi
  const addTenant = useCallback(
    (data: Omit<Tenant, "id">) => {
      const id = `t${Date.now()}`;
      setTenants((prev) => [...prev, { id, ...data }]);
      setRooms((prev) =>
        prev.map((r) =>
          r.id === data.roomId ? { ...r, status: "Terisi" } : r
        )
      );
    },
    []
  );

  // Update data penyewa
  const updateTenant = useCallback((updated: Tenant) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  }, []);

  // Check-out penyewa → kamar kembali Tersedia
  const checkoutTenant = useCallback((id: string) => {
    setTenants((prev) => {
      const tenant = prev.find((t) => t.id === id);
      if (tenant) {
        setRooms((rooms) =>
          rooms.map((r) =>
            r.id === tenant.roomId ? { ...r, status: "Tersedia" } : r
          )
        );
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  // Pindah kamar penyewa
  const moveTenantRoom = useCallback((tenantId: string, newRoomId: string) => {
    setTenants((prev) => {
      const tenant = prev.find((t) => t.id === tenantId);
      if (!tenant) return prev;

      // Bebaskan kamar lama, isi kamar baru
      setRooms((rooms) =>
        rooms.map((r) => {
          if (r.id === tenant.roomId) return { ...r, status: "Tersedia" };
          if (r.id === newRoomId) return { ...r, status: "Terisi" };
          return r;
        })
      );

      return prev.map((t) => {
        if (t.id !== tenantId) return t;
        // Cari nomor & harga kamar baru (dibaca langsung dari state rooms saat ini)
        return { ...t, roomId: newRoomId };
      });
    });

    // Update roomNumber & biayaSewa berdasarkan kamar baru
    setRooms((currentRooms) => {
      const newRoom = currentRooms.find((r) => r.id === newRoomId);
      if (newRoom) {
        setTenants((prev) =>
          prev.map((t) =>
            t.id === tenantId
              ? { ...t, roomId: newRoomId, roomNumber: newRoom.number, biayaSewa: newRoom.price }
              : t
          )
        );
      }
      return currentRooms;
    });
  }, []);

  // Beri diskon → kurangi biayaSewa
  const addDiscount = useCallback((tenantId: string, amount: number) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === tenantId
          ? { ...t, biayaSewa: Math.max(0, t.biayaSewa - amount) }
          : t
      )
    );
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        tenants,
        rooms,
        isDarkMode,
        toggleDarkMode,
        addTenant,
        updateTenant,
        checkoutTenant,
        moveTenantRoom,
        addDiscount,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────
export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard harus digunakan di dalam <DashboardProvider>");
  }
  return ctx;
}
