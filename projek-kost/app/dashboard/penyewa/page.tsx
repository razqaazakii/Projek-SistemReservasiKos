"use client";

import React, { useState } from "react";
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
import KtpModal from "@/components/dashboard/KtpModal";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
            style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}
          >
            Data Penyewa
          </h1>
          <p className={`mt-1 text-base ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            {tenants.length} penghuni aktif terdaftar di sistem
          </p>
        </div>
        <button
          onClick={() => openModal("add")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A8A] text-white font-bold text-[14px] hover:bg-blue-800 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Penyewa
        </button>
      </div>

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
    </div>
  );
}