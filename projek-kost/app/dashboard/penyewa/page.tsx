"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthUser, AuthUser } from "@/lib/auth";
import {
  Search,
  Plus,
  Users,
  LogOut,
  ArrowRightLeft,
  X,
} from "lucide-react";
import { useDashboard, formatRupiah } from "@/lib/dashboardContext";
import { Tenant, Room } from "@/types/dashboard";
import { Room as CatalogRoom } from "@/types/room";
import KtpModal from "@/components/dashboard/KtpModal";
import { getAllReservationsAction, updateReservationStatusAction, deleteReservationAction } from "@/actions/booking";
import { getRoomsAction, createRoomAction, updateRoomAction, deleteRoomAction } from "@/actions/room";

interface IncomingReservation {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string;
  checkInDate: Date | string;
  durationMonths: number;
  totalPrice: number;
  notes?: string | null;
  status: string;
  createdAt: Date | string;
  room?: {
    name: string;
    location: string;
    price: number;
  } | null;
}

type ModalType = "add" | "edit" | "ktp" | "move" | "discount" | "checkout" | null;

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

const BLANK_FORM: Omit<Tenant, "id"> = {
  nama: "",
  nik: "",
  roomId: "",
  roomNumber: "",
  phone: "",
  tanggalMasuk: getTodayDate(),
  biayaSewa: 0,
  deposit: 0,
  statusBayar: "Belum Bayar",
  jatuhTempo: "",
  ktpImage: "",
  catatan: "",
};

export default function PenyewaPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      router.push('/login?redirect=/dashboard/penyewa');
    } else {
      setCurrentUser(user);
      setIsAuthChecking(false);
    }
  }, [router]);
  const {
    tenants,
    rooms,
    isDarkMode,
    addTenant,
    updateTenant,
    checkoutTenant,
    moveTenantRoom,
    addDiscount,
  } = useDashboard();

  // 1. State filter & modal aktif
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<'penghuni' | 'reservasi' | 'kamar'>('penghuni');
  const [incomingReservations, setIncomingReservations] = useState<IncomingReservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);

  // State Manajemen Kamar Kos (Entitas Room - PostgreSQL)
  const [dbRoomsList, setDbRoomsList] = useState<CatalogRoom[]>([]);
  const [isLoadingDbRooms, setIsLoadingDbRooms] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomModalMode, setRoomModalMode] = useState<'create' | 'edit'>('create');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomFormData, setRoomFormData] = useState({
    name: '',
    price: '',
    type: '' as CatalogRoom['type'],
    description: '',
    location: '',
    facilities: '',
    imageUrl: '',
    isAvailable: true,
  });
  const [roomFormErrors, setRoomFormErrors] = useState<Record<string, string[] | undefined>>({});
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false);
  const [crudNotice, setCrudNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchDbRooms = async () => {
    setIsLoadingDbRooms(true);
    try {
      const res = await getRoomsAction();
      if (res.success && res.data) {
        setDbRoomsList(res.data);
      }
    } finally {
      setIsLoadingDbRooms(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setIsLoadingReservations(true);
      getAllReservationsAction()
        .then((res) => {
          if (res.success && res.data) {
            setIncomingReservations(res.data as unknown as IncomingReservation[]);
          }
        })
        .finally(() => setIsLoadingReservations(false));

      fetchDbRooms();
    }
  }, [currentUser]);

  const handleUpdateReservationStatus = async (id: string, newStatus: string) => {
    const res = await updateReservationStatusAction(id, newStatus);
    if (res.success) {
      setIncomingReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      setCrudNotice({ type: 'success', message: `Status reservasi berhasil diubah ke ${newStatus}.` });
      setTimeout(() => setCrudNotice(null), 3000);
    }
  };

  const handleDeleteReservation = async (id: string) => {
    if (window.confirm('Hapus riwayat reservasi ini secara permanen?')) {
      const res = await deleteReservationAction(id);
      if (res.success) {
        setIncomingReservations((prev) => prev.filter((r) => r.id !== id));
        setCrudNotice({ type: 'success', message: 'Data reservasi berhasil dihapus.' });
        setTimeout(() => setCrudNotice(null), 3500);
      } else {
        alert(res.message || 'Gagal menghapus reservasi.');
      }
    }
  };

  const handleOpenCreateRoom = () => {
    setRoomModalMode('create');
    setEditingRoomId(null);
    setRoomFormData({
      name: '',
      price: '',
      type: '' as CatalogRoom['type'],
      description: '',
      location: '',
      facilities: 'AC, WiFi Cepat, Kamar Mandi Dalam',
      imageUrl: '',
      isAvailable: true,
    });
    setRoomFormErrors({});
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room: CatalogRoom) => {
    setRoomModalMode('edit');
    setEditingRoomId(room.id);
    setRoomFormData({
      name: room.name,
      price: String(room.price),
      type: room.type,
      description: room.description || '',
      location: room.location,
      facilities: room.facilities.join(', '),
      imageUrl: room.imageUrl,
      isAvailable: room.isAvailable,
    });
    setRoomFormErrors({});
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRoom(true);
    setRoomFormErrors({});

    try {
      if (roomModalMode === 'create') {
        const res = await createRoomAction(roomFormData);
        if (res.success && res.data) {
          setDbRoomsList((prev) => [res.data!, ...prev]);
          setIsRoomModalOpen(false);
          setCrudNotice({ type: 'success', message: res.message });
          setTimeout(() => setCrudNotice(null), 3500);
        } else if (res.errors) {
          setRoomFormErrors(res.errors);
        } else {
          alert(res.message);
        }
      } else if (roomModalMode === 'edit' && editingRoomId) {
        const res = await updateRoomAction(editingRoomId, roomFormData);
        if (res.success) {
          await fetchDbRooms();
          setIsRoomModalOpen(false);
          setCrudNotice({ type: 'success', message: res.message });
          setTimeout(() => setCrudNotice(null), 3500);
        } else if (res.errors) {
          setRoomFormErrors(res.errors);
        } else {
          alert(res.message);
        }
      }
    } finally {
      setIsSubmittingRoom(false);
    }
  };

  const handleDeleteRoom = async (room: CatalogRoom) => {
    if (window.confirm(`Hapus kamar "${room.name}" secara permanen? Seluruh riwayat reservasi terkait kamar ini juga akan terhapus otomatis.`)) {
      const res = await deleteRoomAction(room.id);
      if (res.success) {
        setDbRoomsList((prev) => prev.filter((r) => r.id !== room.id));
        setCrudNotice({ type: 'success', message: res.message });
        setTimeout(() => setCrudNotice(null), 3500);
      } else {
        alert(res.message);
      }
    }
  };
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // 2. State form input yang jelas & terpisah
  const [formData, setFormData] = useState<Omit<Tenant, "id">>(BLANK_FORM);
  const [targetRoomId, setTargetRoomId] = useState("");
  const [discountNominal, setDiscountNominal] = useState("");

  // Filter daftar penyewa (berdasarkan nama, NIK, atau nomor kamar)
  const keyword = search.trim().toLowerCase();
  const filteredTenants = tenants.filter(
    (t) =>
      t.nama.toLowerCase().includes(keyword) ||
      t.nik.toLowerCase().includes(keyword) ||
      t.roomNumber.toLowerCase().includes(keyword)
  );

  // Daftar kamar yang masih kosong
  const availableRooms = rooms.filter((r: Room) => r.status === "Tersedia");

  // Buka modal sesuai jenisnya
  function openModal(type: ModalType, tenant: Tenant | null = null) {
    setActiveModal(type);
    setSelectedTenant(tenant);
    setTargetRoomId("");
    setDiscountNominal("");

    if (type === "add") {
      setFormData({ ...BLANK_FORM, tanggalMasuk: getTodayDate() });
    } else if (type === "edit" && tenant) {
      setFormData({ ...tenant });
    }
  }

  // Tutup modal & bersihkan state sementara
  function closeModal() {
    setActiveModal(null);
    setSelectedTenant(null);
    setTargetRoomId("");
    setDiscountNominal("");
  }

  // 1. Simpan Data Penyewa (Tambah Baru / Edit)
  function handleSave() {
    if (!formData.nama.trim() || !formData.nik.trim()) return;

    if (activeModal === "edit" && selectedTenant) {
      updateTenant({
        ...selectedTenant,
        ...formData,
      });
    } else if (activeModal === "add") {
      const selectedRoom = rooms.find((r: Room) => r.id === formData.roomId);
      if (!selectedRoom) return;

      addTenant({
        ...formData,
        roomNumber: selectedRoom.number,
        biayaSewa: selectedRoom.price,
        tanggalMasuk: formData.tanggalMasuk || getTodayDate(),
        statusBayar: formData.statusBayar || "Belum Bayar",
      });
    }

    closeModal();
  }

  // 2. Pindah Kamar
  function handleMoveRoom() {
    if (selectedTenant && targetRoomId) {
      moveTenantRoom(selectedTenant.id, targetRoomId);
      closeModal();
    }
  }

  // 3. Terapkan Diskon
  function handleApplyDiscount() {
    const nominal = Number(discountNominal);
    if (
      selectedTenant &&
      nominal > 0 &&
      nominal <= selectedTenant.biayaSewa
    ) {
      addDiscount(selectedTenant.id, nominal);
      closeModal();
    }
  }

  // 4. Konfirmasi Check-out
  function handleConfirmCheckout() {
    if (selectedTenant) {
      checkoutTenant(selectedTenant.id);
      closeModal();
    }
  }

  // Helper validasi form
  const isFormInvalid =
    !formData.nama.trim() ||
    !formData.nik.trim() ||
    (activeModal === "add" && !formData.roomId);

  // Helper validasi diskon
  const parsedDiscount = Number(discountNominal) || 0;
  const isDiscountInvalid =
    !selectedTenant ||
    parsedDiscount <= 0 ||
    parsedDiscount > selectedTenant.biayaSewa;

  if (isAuthChecking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm text-slate-500 flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Memverifikasi hak akses admin...
        </div>
      </div>
    );
  }

  // Proteksi Hak Akses (RBAC): Hanya Peran 'admin' yang Boleh Mengakses
  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-slate-50">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4 shadow-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 mb-3 border border-red-200">
          HTTP 403 Forbidden • Akses Terbatas
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
          Area Khusus Pengelola Kos (Admin)
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mb-6 leading-relaxed">
          Akun Anda saat ini masuk sebagai <strong className="text-slate-900 font-semibold">{currentUser?.name || 'Pengguna'}</strong> dengan peran <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono text-xs font-semibold">Penyewa</span>. Sesuai matriks kontrol akses (RBAC), Anda tidak memiliki izin untuk mengelola kamar atau melihat dokumen identitas KTP penghuni lain.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/profile"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            Kembali ke Profil Saya
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors"
          >
            Ke Beranda R-Stay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 sm:py-10 ${isDarkMode ? "bg-slate-900" : "bg-slate-50"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Notifikasi Hasil Operasi CRUD */}
      {crudNotice && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border animate-fadeIn ${
          crudNotice.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{crudNotice.message}</span>
          <button onClick={() => setCrudNotice(null)} className="font-bold px-2 py-0.5 hover:opacity-75 cursor-pointer">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
            style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}
          >
            {activeTab === 'penghuni'
              ? 'Data Penyewa'
              : activeTab === 'reservasi'
              ? 'Pengajuan Reservasi Masuk'
              : 'Manajemen Kamar Kos'}
          </h1>
          <p className={`mt-1 text-base ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            {activeTab === 'penghuni'
              ? `${tenants.length} penghuni aktif terdaftar di sistem`
              : activeTab === 'reservasi'
              ? `${incomingReservations.length} permohonan booking tercatat di sistem`
              : `${dbRoomsList.length} unit kamar kos terdaftar di sistem`}
          </p>
        </div>

        {activeTab === 'penghuni' && (
          <button
            onClick={() => openModal("add")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A8A] text-white font-bold text-[14px] hover:bg-blue-800 transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Penyewa
          </button>
        )}

        {activeTab === 'kamar' && (
          <button
            onClick={handleOpenCreateRoom}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[14px] shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Kamar Kos
          </button>
        )}
      </div>

      {/* Tab Navigasi Meja Kerja Admin */}
      <div className="flex items-center gap-3 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('penghuni')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'penghuni'
              ? 'border-[#1E3A8A] text-[#1E3A8A]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Data Penghuni Aktif ({tenants.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reservasi')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'reservasi'
              ? 'border-[#1E3A8A] text-[#1E3A8A]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>📥 Permohonan Booking Masuk</span>
          {incomingReservations.filter((r) => r.status === 'PENDING').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white animate-pulse">
              {incomingReservations.filter((r) => r.status === 'PENDING').length} Baru
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kamar')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'kamar'
              ? 'border-[#1E3A8A] text-[#1E3A8A]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>🏠 Kelola Kamar Kos</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            {dbRoomsList.length} Unit
          </span>
        </button>
      </div>

      {activeTab === 'kamar' ? (
        <div className={`rounded-xl overflow-hidden border p-5 space-y-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-[#E5E7EB]"}`}>
          <div className="border-b border-slate-100 pb-3">
            <h2 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Daftar Unit Kamar Kos
            </h2>
            <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Kelola ketersediaan, tarif sewa bulanan, dan fasilitas unit kamar kos
            </p>
          </div>

          {isLoadingDbRooms ? (
            <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Memuat data kamar kos...
            </div>
          ) : dbRoomsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-xs font-semibold ${isDarkMode ? "bg-slate-900/50 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                    <th className="py-3 px-4">Kamar Kos</th>
                    <th className="py-3 px-4">Tipe</th>
                    <th className="py-3 px-4">Lokasi</th>
                    <th className="py-3 px-4">Harga / Bulan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Tindakan Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {dbRoomsList.map((room) => (
                    <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={room.imageUrl}
                            alt={room.name}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{room.name}</div>
                            <div className="text-xs text-slate-400 font-mono">ID: {room.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          room.type === 'Putra'
                            ? 'bg-blue-100 text-blue-800'
                            : room.type === 'Putri'
                            ? 'bg-pink-100 text-pink-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          Kos {room.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {room.location}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-blue-700">{formatRupiah(room.price)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          room.isAvailable
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {room.isAvailable ? '✓ Tersedia' : 'Penuh'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRoom(room)}
                            className="px-2.5 py-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(room)}
                            className="px-2.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <div className="text-2xl">🏨</div>
              <p className="text-sm font-semibold text-slate-700">Belum Ada Kamar Kos Terdaftar</p>
              <button
                onClick={handleOpenCreateRoom}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                + Tambah Kamar Sekarang
              </button>
            </div>
          )}
        </div>
      ) : activeTab === 'reservasi' ? (
        <div className={`rounded-xl overflow-hidden border p-5 space-y-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-[#E5E7EB]"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Daftar Permohonan Booking dari Website
              </h2>
              <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Permohonan sewa kamar yang diajukan calon penyewa melalui form reservasi online R-Stay
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
              Total: {incomingReservations.length} Pengajuan
            </span>
          </div>

          {isLoadingReservations ? (
            <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Memuat data reservasi masuk...
            </div>
          ) : incomingReservations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-xs font-semibold ${isDarkMode ? "bg-slate-900/50 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                    <th className="py-3 px-4">Calon Penyewa</th>
                    <th className="py-3 px-4">Kamar Target</th>
                    <th className="py-3 px-4">Mulai Sewa &amp; Durasi</th>
                    <th className="py-3 px-4">Estimasi Biaya</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Tindakan Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {incomingReservations.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{res.fullName}</div>
                        <div className="text-xs text-slate-500 font-mono">{res.email}</div>
                        <div className="text-xs text-emerald-700 font-medium">WA: {res.whatsapp}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{res.room?.name || 'Kamar R-Stay'}</div>
                        <div className="text-xs text-slate-500">{res.room?.location}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div>{new Date(res.checkInDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        <span className="font-semibold text-slate-800">{res.durationMonths} Bulan</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-blue-700">{formatRupiah(res.totalPrice)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          res.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : res.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}>
                          {res.status === 'CONFIRMED' ? 'Disetujui' : res.status === 'CANCELLED' ? 'Ditolak' : 'Menunggu Konfirmasi'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {res.status === 'PENDING' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateReservationStatus(res.id, 'CONFIRMED')}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                title="Setujui permohonan reservasi"
                              >
                                ✓ Setujui
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateReservationStatus(res.id, 'CANCELLED')}
                                className="px-2.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                title="Tolak permohonan reservasi"
                              >
                                ✕ Tolak
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic mr-1">Telah diproses</span>
                          )}

                          {/* Tombol Hapus Reservasi */}
                          <button
                            type="button"
                            onClick={() => handleDeleteReservation(res.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus data reservasi"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <div className="text-2xl">📭</div>
              <p className="text-sm font-semibold text-slate-700">Belum Ada Permohonan Reservasi Masuk</p>
              <p className="text-xs text-slate-400">Semua permohonan booking dari website akan muncul di sini secara otomatis.</p>
            </div>
          )}
        </div>
      ) : (
        <>
      {/* Kotak Pencarian */}
      <div
        className={`rounded-2xl border p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
          }`}
      >
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-slate-500" : "text-slate-400"
              }`}
          />
          <input
            type="text"
            placeholder="Cari nama penyewa, NIK, atau nomor kamar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 ${isDarkMode
              ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500"
              : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
              }`}
          />
        </div>
      </div>

      {/* Tabel Master Penghuni */}
      <div
        className={`rounded-xl overflow-hidden border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-[#E5E7EB]"
          }`}
        style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`border-b ${isDarkMode
                  ? "bg-slate-900/50 border-slate-700 text-slate-200"
                  : "bg-[#F8FAFC] border-[#E5E7EB] text-[#1F2937]"
                  }`}
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                <th scope="col" className="px-5 py-4 text-[15px] font-bold tracking-wider">Nama & NIK</th>
                <th scope="col" className="px-5 py-4 text-[15px] font-bold tracking-wider">Kamar</th>
                <th scope="col" className="px-5 py-4 text-[15px] font-bold tracking-wider">No. HP</th>
                <th scope="col" className="px-5 py-4 text-[15px] font-bold tracking-wider">Tanggal Masuk</th>
                <th scope="col" className="px-5 py-4 text-[15px] font-bold tracking-wider">Harga Sewa</th>
                <th scope="col" className="px-5 py-4 text-[15px] font-bold tracking-wider">Jatuh Tempo</th>
                <th scope="col" className="px-5 py-4 text-[15px] font-bold tracking-wider text-center">Foto KTP</th>
                <th scope="col" className="px-5 py-4 text-[15px] font-bold tracking-wider text-center">Aksi Administrasi</th>
              </tr>
            </thead>
            <tbody
              className={`text-[16px] ${isDarkMode ? "text-slate-200" : "text-[#1F2937]"}`}
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              {filteredTenants.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b transition-colors ${isDarkMode
                    ? "border-slate-700 hover:bg-slate-700/40"
                    : "border-[#E5E7EB] hover:bg-[#FAF9F6]"
                    }`}
                >
                  {/* Nama & NIK */}
                  <td className="px-5 py-4.5 font-bold">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {item.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[16px]">{item.nama}</div>
                        <div className="text-[13px] text-slate-500 font-normal">
                          NIK: {item.nik}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Kamar */}
                  <td className="px-5 py-4.5 font-semibold">
                    <span className="inline-block px-3 py-1 rounded-md bg-blue-50 text-[#1E3A8A] border border-blue-100 text-[14px] font-bold">
                      Kamar {item.roomNumber}
                    </span>
                  </td>

                  {/* No. HP */}
                  <td className={`px-5 py-4.5 text-[15px] ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                    {item.phone}
                  </td>

                  {/* Tanggal Masuk */}
                  <td className={`px-5 py-4.5 text-[15px] ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                    {item.tanggalMasuk}
                  </td>

                  {/* Harga Sewa */}
                  <td className="px-5 py-4.5 font-bold">
                    {formatRupiah(item.biayaSewa)}
                    <span className="text-[13px] font-normal text-slate-500"> /bln</span>
                  </td>

                  {/* Jatuh Tempo & Status */}
                  <td className="px-5 py-4.5">
                    <div className="text-[15px] font-semibold">
                      {item.jatuhTempo || "—"}
                    </div>
                    <span
                      className={`inline-block text-[12px] font-bold px-2.5 py-0.5 rounded-full mt-1 border ${item.statusBayar === "Lunas"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-red-50 text-red-800 border-red-200"
                        }`}
                    >
                      {item.statusBayar}
                    </span>
                  </td>

                  {/* Kolom Foto KTP */}
                  <td className="px-5 py-4.5 text-center">
                    {item.ktpImage ? (
                      <button
                        type="button"
                        onClick={() => openModal("ktp", item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold transition-colors"
                      >
                        <svg
                          className="w-4 h-4 text-slate-600"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.364a4.125 4.125 0 00-6.338 0"
                          />
                        </svg>
                        <span>Lihat KTP</span>
                      </button>
                    ) : (
                      <span className="text-[13px] italic text-slate-400">Belum ada</span>
                    )}
                  </td>

                  {/* Kolom Aksi Administrasi */}
                  <td className="px-5 py-4.5">
                    <div className="flex items-center justify-center gap-1.5 text-[13px]">
                      <button
                        type="button"
                        onClick={() => openModal("edit", item)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-100 font-semibold text-slate-700 transition-colors"
                        title="Edit Data Penghuni"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={item.statusBayar === "Lunas"}
                        onClick={() => updateTenant({ ...item, statusBayar: "Lunas" })}
                        className="px-3 py-1.5 rounded-lg bg-[#1E3A8A] text-white hover:bg-blue-900 font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Tandai Bayar / Lunas"
                      >
                        Bayar
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal("discount", item)}
                        className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold transition-colors"
                        title="Beri Diskon Sewa"
                      >
                        Diskon
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal("move", item)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-100 font-semibold text-slate-700 transition-colors"
                        title="Pindah Kamar"
                      >
                        Pindah
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal("checkout", item)}
                        className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-semibold transition-colors"
                        title="Check-out / Hapus Penghuni"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTenants.length === 0 && (
            <div className="py-16 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-[15px] font-semibold">Tidak ada data penyewa yang sesuai.</p>
            </div>
          )}
        </div>
      </div>

        </>
      )}

      {/* 1. Modal Tambah / Edit Penyewa */}
      {(activeModal === "add" || activeModal === "edit") && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl border max-h-[90vh] overflow-y-auto ${isDarkMode
              ? "bg-slate-800 border-slate-700 text-slate-100"
              : "bg-white border-slate-200 text-slate-900"
              }`}
          >
            <div
              className={`flex items-center justify-between px-6 py-5 border-b ${isDarkMode ? "border-slate-700" : "border-slate-100"
                }`}
            >
              <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>
                {activeModal === "edit" ? "Edit Data Penyewa" : "Daftarkan Penyewa Baru"}
              </h3>
              <button
                onClick={closeModal}
                className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-bold mb-1.5">Nama Lengkap</label>
                <input
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Nama sesuai KTP"
                  className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 ${isDarkMode
                    ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500"
                    : "bg-slate-50 border-slate-200"
                    }`}
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold mb-1.5">NIK (16 digit)</label>
                <input
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                  placeholder="3171012904990001"
                  className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 ${isDarkMode
                    ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500"
                    : "bg-slate-50 border-slate-200"
                    }`}
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold mb-1.5">No. WhatsApp</label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0812XXXXXXXX"
                  className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 ${isDarkMode
                    ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500"
                    : "bg-slate-50 border-slate-200"
                    }`}
                />
              </div>

              {activeModal === "add" && (
                <div>
                  <label className="block text-[13px] font-bold mb-1.5">Pilih Kamar</label>
                  <select
                    value={formData.roomId}
                    onChange={(e) => {
                      const room = rooms.find((r: Room) => r.id === e.target.value);
                      setFormData({
                        ...formData,
                        roomId: e.target.value,
                        roomNumber: room ? room.number : "",
                        biayaSewa: room ? room.price : 0,
                      });
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none ${isDarkMode
                      ? "bg-slate-700 border-slate-600 text-slate-100"
                      : "bg-slate-50 border-slate-200"
                      }`}
                  >
                    <option value="">-- Pilih Kamar Tersedia --</option>
                    {availableRooms.map((r: Room) => (
                      <option key={r.id} value={r.id}>
                        Kamar {r.number} ({r.type}) — {formatRupiah(r.price)}/bln
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold mb-1.5">Tanggal Masuk</label>
                  <input
                    type="date"
                    value={formData.tanggalMasuk}
                    onChange={(e) => setFormData({ ...formData, tanggalMasuk: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none ${isDarkMode
                      ? "bg-slate-700 border-slate-600 text-slate-100"
                      : "bg-slate-50 border-slate-200"
                      }`}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold mb-1.5">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={formData.jatuhTempo}
                    onChange={(e) => setFormData({ ...formData, jatuhTempo: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none ${isDarkMode
                      ? "bg-slate-700 border-slate-600 text-slate-100"
                      : "bg-slate-50 border-slate-200"
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold mb-1.5">Deposit (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })}
                  className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none ${isDarkMode
                    ? "bg-slate-700 border-slate-600 text-slate-100"
                    : "bg-slate-50 border-slate-200"
                    }`}
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold mb-1.5">URL Foto KTP (opsional)</label>
                <input
                  value={formData.ktpImage ?? ""}
                  onChange={(e) => setFormData({ ...formData, ktpImage: e.target.value })}
                  placeholder="https://..."
                  className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none ${isDarkMode
                    ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500"
                    : "bg-slate-50 border-slate-200"
                    }`}
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold mb-1.5">Catatan</label>
                <textarea
                  rows={2}
                  value={formData.catatan ?? ""}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Informasi tambahan tentang penyewa..."
                  className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none resize-none ${isDarkMode
                    ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500"
                    : "bg-slate-50 border-slate-200"
                    }`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className={`flex-1 py-3 rounded-xl font-bold text-[14px] border transition-colors ${isDarkMode
                    ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={isFormInvalid}
                  className="flex-1 py-3 rounded-xl font-bold text-[14px] bg-[#1E3A8A] text-white hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activeModal === "edit" ? "Simpan Perubahan" : "Daftarkan Penyewa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Pindah Kamar */}
      {activeModal === "move" && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-sm rounded-2xl shadow-2xl border p-6 ${isDarkMode
              ? "bg-slate-800 border-slate-700 text-slate-100"
              : "bg-white border-slate-200 text-slate-900"
              }`}
          >
            <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
              Pindah Kamar — {selectedTenant.nama}
            </h3>
            <p className={`text-[13px] mb-3 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Kamar saat ini: <strong>Kamar {selectedTenant.roomNumber}</strong>
            </p>
            <label className="block text-[13px] font-bold mb-1.5">Pilih Kamar Tujuan</label>
            <select
              value={targetRoomId}
              onChange={(e) => setTargetRoomId(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none mb-4 ${isDarkMode
                ? "bg-slate-700 border-slate-600 text-slate-100"
                : "bg-slate-50 border-slate-200"
                }`}
            >
              <option value="">-- Pilih Kamar Tersedia --</option>
              {availableRooms.map((r: Room) => (
                <option key={r.id} value={r.id}>
                  Kamar {r.number} ({r.type}) — {formatRupiah(r.price)}/bln
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className={`flex-1 py-2.5 rounded-xl font-bold text-[14px] border ${isDarkMode ? "border-slate-600 text-slate-300" : "border-slate-300 text-slate-600"
                  }`}
              >
                Batal
              </button>
              <button
                onClick={handleMoveRoom}
                disabled={!targetRoomId}
                className="flex-1 py-2.5 rounded-xl font-bold text-[14px] bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" /> Pindahkan
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Diskon Sewa */}
      {activeModal === "discount" && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-sm rounded-2xl shadow-2xl border p-6 ${isDarkMode
              ? "bg-slate-800 border-slate-700 text-slate-100"
              : "bg-white border-slate-200 text-slate-900"
              }`}
          >
            <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
              Beri Diskon — {selectedTenant.nama}
            </h3>
            <p className={`text-[13px] mb-3 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Tarif sewa saat ini: <strong>{formatRupiah(selectedTenant.biayaSewa)}/bln</strong>
            </p>
            <label className="block text-[13px] font-bold mb-1.5">Jumlah Potongan (Rp)</label>
            <input
              type="number"
              min={0}
              max={selectedTenant.biayaSewa}
              value={discountNominal}
              onChange={(e) => setDiscountNominal(e.target.value)}
              placeholder="Contoh: 100000"
              className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none mb-4 ${isDarkMode
                ? "bg-slate-700 border-slate-600 text-slate-100"
                : "bg-slate-50 border-slate-200"
                }`}
            />
            {parsedDiscount > 0 && (
              <p className={`text-[13px] mb-3 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                {parsedDiscount <= selectedTenant.biayaSewa ? (
                  <>
                    Tarif setelah diskon:{" "}
                    <strong className="text-emerald-600">
                      {formatRupiah(selectedTenant.biayaSewa - parsedDiscount)}/bln
                    </strong>
                  </>
                ) : (
                  <span className="text-red-500 font-semibold">
                    Potongan tidak boleh melebihi tarif sewa saat ini.
                  </span>
                )}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className={`flex-1 py-2.5 rounded-xl font-bold text-[14px] border ${isDarkMode ? "border-slate-600 text-slate-300" : "border-slate-300 text-slate-600"
                  }`}
              >
                Batal
              </button>
              <button
                onClick={handleApplyDiscount}
                disabled={isDiscountInvalid}
                className="flex-1 py-2.5 rounded-xl font-bold text-[14px] bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
              >
                Terapkan Diskon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Konfirmasi Check-out / Hapus */}
      {activeModal === "checkout" && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-sm rounded-2xl shadow-2xl border p-6 ${isDarkMode
              ? "bg-slate-800 border-slate-700 text-slate-100"
              : "bg-white border-slate-200 text-slate-900"
              }`}
          >
            <div className="w-14 h-14 mx-auto bg-red-100 dark:bg-red-950 rounded-2xl flex items-center justify-center mb-4">
              <LogOut className="w-7 h-7 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
              Konfirmasi Check-out
            </h3>
            <p className={`text-[14px] text-center mb-5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Apakah Anda yakin ingin melakukan check-out untuk{" "}
              <strong>{selectedTenant.nama}</strong> dari Kamar {selectedTenant.roomNumber}? Tindakan
              ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className={`flex-1 py-2.5 rounded-xl font-bold border ${isDarkMode ? "border-slate-600 text-slate-300" : "border-slate-300 text-slate-600"
                  }`}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmCheckout}
                className="flex-1 py-2.5 rounded-xl font-bold text-[14px] bg-red-600 text-white hover:bg-red-700"
              >
                Ya, Check-out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Lihat Foto KTP */}
      {activeModal === "ktp" && selectedTenant && (
        <KtpModal
          isOpen={true}
          tenantName={selectedTenant.nama}
          nik={selectedTenant.nik}
          imageUrl={selectedTenant.ktpImage}
          onClose={closeModal}
        />
      )}

      {/* 6. Modal Tambah / Edit Kamar Kos (PostgreSQL Zod Validation) */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  🏨
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    {roomModalMode === 'create' ? 'Tambah Kamar Kos Baru' : 'Edit Data Kamar Kos'}
                  </h3>
                  <p className="text-[11px] text-emerald-700">Tersimpan otomatis dan terhubung ke katalog publik</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRoomModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoom} noValidate className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Judul / Nama Kamar Kos *
                </label>
                <input
                  type="text"
                  required
                  value={roomFormData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRoomFormData({ ...roomFormData, name: val });
                    const trimmedLower = val.trim().toLowerCase();
                    const isDup =
                      trimmedLower === 'kost griya asri deluxe' ||
                      trimmedLower === 'kost ajolie executive' ||
                      trimmedLower === 'kost putri melati cantika' ||
                      dbRoomsList.some((r) => r.name.trim().toLowerCase() === trimmedLower);

                    if (isDup) {
                      setRoomFormErrors((prev) => ({
                        ...prev,
                        name: ['Judul sudah dipakai item lain.'],
                      }));
                    } else if (trimmedLower.length > 0 && trimmedLower.length < 3) {
                      setRoomFormErrors((prev) => ({
                        ...prev,
                        name: ['Judul minimal 3 karakter.'],
                      }));
                    } else {
                      setRoomFormErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.name;
                        return copy;
                      });
                    }
                  }}
                  onBlur={() => {
                    const trimmedLower = roomFormData.name.trim().toLowerCase();
                    const isDup =
                      trimmedLower === 'kost griya asri deluxe' ||
                      trimmedLower === 'kost ajolie executive' ||
                      trimmedLower === 'kost putri melati cantika' ||
                      dbRoomsList.some((r) => r.name.trim().toLowerCase() === trimmedLower);

                    if (isDup) {
                      setRoomFormErrors((prev) => ({
                        ...prev,
                        name: ['Judul sudah dipakai item lain.'],
                      }));
                    } else if (trimmedLower.length > 0 && trimmedLower.length < 3) {
                      setRoomFormErrors((prev) => ({
                        ...prev,
                        name: ['Judul minimal 3 karakter.'],
                      }));
                    }
                  }}
                  placeholder="Contoh: Kost Griya Asri Deluxe"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition-colors ${
                    roomFormErrors.name
                      ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                      : 'border-slate-200 focus:ring-emerald-500'
                  }`}
                />
                {roomFormErrors.name && (
                  <p className="text-xs text-red-600 mt-1 font-semibold animate-in fade-in">
                    {roomFormErrors.name[0]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Harga Sewa / Bulan (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={roomFormData.price}
                    onChange={(e) => setRoomFormData({ ...roomFormData, price: e.target.value })}
                    placeholder="Contoh: 1750000"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {roomFormErrors.price && (
                    <p className="text-xs text-red-600 mt-1">{roomFormErrors.price[0]}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Kategori / Tipe Kos *
                  </label>
                  <select
                    value={roomFormData.type}
                    onChange={(e) => setRoomFormData({ ...roomFormData, type: e.target.value as CatalogRoom['type'] })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">-- Pilih salah satu kategori --</option>
                    <option value="Campur">Campur</option>
                    <option value="Putra">Putra</option>
                    <option value="Putri">Putri</option>
                  </select>
                  {roomFormErrors.type && (
                    <p className="text-xs text-red-600 mt-1">{roomFormErrors.type[0]}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Deskripsi Kamar *
                  </label>
                  <span
                    className={`text-[11px] font-mono transition-colors ${
                      roomFormData.description.trim().length > 0 && roomFormData.description.trim().length < 10
                        ? 'text-red-600 font-bold'
                        : roomFormData.description.length > 300
                        ? 'text-red-600 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {roomFormData.description.length} / 300 karakter (min. 10)
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={roomFormData.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRoomFormData({ ...roomFormData, description: val });
                    const trimmed = val.trim();
                    if (trimmed.length > 0 && trimmed.length < 10) {
                      setRoomFormErrors((prev) => ({
                        ...prev,
                        description: ['Deskripsi minimal 10 karakter.'],
                      }));
                    } else if (val.length > 300) {
                      setRoomFormErrors((prev) => ({
                        ...prev,
                        description: ['Deskripsi maksimal 300 karakter.'],
                      }));
                    } else {
                      setRoomFormErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.description;
                        return copy;
                      });
                    }
                  }}
                  onBlur={() => {
                    const trimmed = roomFormData.description.trim();
                    if (trimmed.length > 0 && trimmed.length < 10) {
                      setRoomFormErrors((prev) => ({
                        ...prev,
                        description: ['Deskripsi minimal 10 karakter.'],
                      }));
                    } else if (trimmed.length === 0) {
                      setRoomFormErrors((prev) => ({
                        ...prev,
                        description: ['Deskripsi minimal 10 karakter.'],
                      }));
                    }
                  }}
                  placeholder="Tuliskan deskripsi lengkap kamar kos (10 - 300 karakter)"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition-colors ${
                    roomFormErrors.description
                      ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                      : 'border-slate-200 focus:ring-emerald-500'
                  }`}
                />
                {roomFormErrors.description && (
                  <p className="text-xs text-red-600 mt-1 font-medium animate-in fade-in">
                    {roomFormErrors.description[0]}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Lokasi Alamat Kos *
                </label>
                <input
                  type="text"
                  required
                  value={roomFormData.location}
                  onChange={(e) => setRoomFormData({ ...roomFormData, location: e.target.value })}
                  placeholder="Contoh: Kebayoran Baru, Jakarta Selatan"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {roomFormErrors.location && (
                  <p className="text-xs text-red-600 mt-1">{roomFormErrors.location[0]}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Fasilitas Kamar (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={roomFormData.facilities}
                  onChange={(e) => setRoomFormData({ ...roomFormData, facilities: e.target.value })}
                  placeholder="AC, WiFi, Kamar Mandi Dalam, Kasur Springbed"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {roomFormErrors.facilities && (
                  <p className="text-xs text-red-600 mt-1">{roomFormErrors.facilities[0]}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  URL Foto Kamar (Opsional)
                </label>
                <input
                  type="url"
                  value={roomFormData.imageUrl}
                  onChange={(e) => setRoomFormData({ ...roomFormData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isAvailableCheckbox"
                  checked={roomFormData.isAvailable}
                  onChange={(e) => setRoomFormData({ ...roomFormData, isAvailable: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="isAvailableCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Kamar Siap Dihuni / Tersedia untuk Pemesanan
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRoom}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingRoom ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : roomModalMode === 'create' ? (
                    'Tambah Kamar'
                  ) : (
                    'Simpan Perubahan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}