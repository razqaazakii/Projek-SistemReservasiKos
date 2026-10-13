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

const BLANK_TENANT: Omit<Tenant, "id"> = {
  nama: "",
  nik: "",
  roomId: "",
  roomNumber: "",
  phone: "",
  tanggalMasuk: "2025-01-01",
  biayaSewa: 0,
  deposit: 0,
  statusBayar: "Belum Bayar",
  jatuhTempo: "",
  ktpImage: "",
  catatan: "",
};

export default function PenyewaPage() {
  const { tenants, rooms, isDarkMode, addTenant, updateTenant, checkoutTenant, moveTenantRoom, addDiscount } = useDashboard();
  const dm = isDarkMode;

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [form, setForm] = useState<Omit<Tenant, "id">>(BLANK_TENANT);

  const [showKtp, setShowKtp] = useState(false);
  const [ktpTenant, setKtpTenant] = useState<Tenant | null>(null);

  const [movingTenant, setMovingTenant] = useState<Tenant | null>(null);
  const [moveRoomId, setMoveRoomId] = useState("");

  const [discountTenant, setDiscountTenant] = useState<Tenant | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [checkoutConfirm, setCheckoutConfirm] = useState<Tenant | null>(null);

  const filtered = tenants.filter(
    (t) =>
      t.nama.toLowerCase().includes(search.toLowerCase()) ||
      t.nik.includes(search) ||
      t.roomNumber.includes(search)
  );

  const availableRooms = rooms.filter((r: Room) => r.status === "Tersedia");

  const openAdd = () => {
    setEditTenant(null);
    setForm(BLANK_TENANT);
    setShowModal(true);
  };

  const openEdit = (tenant: Tenant) => {
    setEditTenant(tenant);
    setForm({ ...tenant });
    setShowModal(true);
  };

  const handleSave = () => {
    // Auto-fill roomNumber from room selection
    const room = rooms.find((r: Room) => r.id === form.roomId);
    const finalForm: Omit<Tenant, "id"> = {
      nama: form.nama,
      nik: form.nik,
      roomId: form.roomId,
      roomNumber: room ? room.number : (form.roomNumber || ""),
      phone: form.phone,
      tanggalMasuk: form.tanggalMasuk || "2025-01-01",
      biayaSewa: room ? room.price : (form.biayaSewa || 0),
      deposit: form.deposit || 0,
      statusBayar: form.statusBayar || "Belum Bayar",
      jatuhTempo: form.jatuhTempo || "",
      ktpImage: form.ktpImage || "",
      catatan: form.catatan || "",
    };
    if (editTenant) {
      updateTenant({ ...editTenant, ...finalForm });
    } else {
      addTenant(finalForm);
    }
    setShowModal(false);
  };

  const handleMove = () => {
    if (movingTenant && moveRoomId) {
      moveTenantRoom(movingTenant.id, moveRoomId);
      setMovingTenant(null);
      setMoveRoomId("");
    }
  };

  const handleDiscount = () => {
    if (discountTenant && discountAmount > 0) {
      addDiscount(discountTenant.id, discountAmount);
      setDiscountTenant(null);
      setDiscountAmount(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={`text-3xl font-bold ${dm ? "text-white" : "text-slate-900"}`}
            style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}
          >
            Data Penyewa
          </h1>
          <p className={`mt-1 text-base ${dm ? "text-slate-400" : "text-slate-500"}`}>
            {tenants.length} penghuni aktif terdaftar di sistem
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A8A] text-white font-bold text-[14px] hover:bg-blue-800 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Penyewa
        </button>
      </div>

      {/* Search */}
      <div className={`rounded-2xl border p-4 ${dm ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dm ? "text-slate-500" : "text-slate-400"}`} />
          <input
            type="text"
            placeholder="Cari nama penyewa, NIK, atau nomor kamar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 ${dm
              ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500"
              : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
              }`}
          />
        </div>
      </div>

      {/* Tabel Master Penghuni & Administrasi Sewa - Card Wrapper */}
      <div
        className="rounded-xl bg-white overflow-hidden"
        style={{
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="bg-[#F8FAFC]"
                style={{
                  borderBottom: "1px solid #E5E7EB",
                  fontFamily: "'Lato', sans-serif",
                }}
              >
                <th scope="col" className="px-5 py-4 text-[#1F2937] text-[15px] font-bold tracking-wider">Nama & NIK</th>
                <th scope="col" className="px-5 py-4 text-[#1F2937] text-[15px] font-bold tracking-wider">Kamar</th>
                <th scope="col" className="px-5 py-4 text-[#1F2937] text-[15px] font-bold tracking-wider">No. HP</th>
                <th scope="col" className="px-5 py-4 text-[#1F2937] text-[15px] font-bold tracking-wider">Tanggal Masuk</th>
                <th scope="col" className="px-5 py-4 text-[#1F2937] text-[15px] font-bold tracking-wider">Harga Sewa</th>
                <th scope="col" className="px-5 py-4 text-[#1F2937] text-[15px] font-bold tracking-wider">Jatuh Tempo</th>
                <th scope="col" className="px-5 py-4 text-[#1F2937] text-[15px] font-bold tracking-wider text-center">Foto KTP</th>
                <th scope="col" className="px-5 py-4 text-[#1F2937] text-[15px] font-bold tracking-wider text-center">Aksi Administrasi</th>
              </tr>
            </thead>
            <tbody
              className="text-[16px]"
              style={{
                fontFamily: "'Lato', sans-serif",
                color: "#1F2937",
              }}
            >
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#FAF9F6] transition-colors"
                  style={{
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  {/* Nama & NIK */}
                  <td className="px-5 py-4.5 font-bold text-[#1F2937]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {item.nama.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-[16px] text-[#1F2937]">
                          {item.nama}
                        </div>
                        <div className="text-[13px] text-slate-500 font-normal">
                          NIK: {item.nik}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Kamar */}
                  <td className="px-5 py-4.5 font-semibold text-[#1F2937]">
                    <span className="inline-block px-3 py-1 rounded-md bg-blue-50 text-[#1E3A8A] border border-blue-100 text-[14px] font-bold">
                      Kamar {item.roomNumber}
                    </span>
                  </td>

                  {/* No. HP */}
                  <td className="px-5 py-4.5 text-[15px] text-slate-600">
                    {item.phone}
                  </td>

                  {/* Tanggal Masuk */}
                  <td className="px-5 py-4.5 text-[15px] text-slate-600">
                    {item.tanggalMasuk}
                  </td>

                  {/* Harga Sewa */}
                  <td className="px-5 py-4.5 font-bold text-[#1F2937]">
                    {formatRupiah(item.biayaSewa)}
                    <span className="text-[13px] font-normal text-slate-500"> /bln</span>
                  </td>

                  {/* Jatuh Tempo & Status */}
                  <td className="px-5 py-4.5">
                    <div className="text-[15px] font-semibold text-[#1F2937]">
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
                        onClick={() => {
                          setKtpTenant(item);
                          setShowKtp(true);
                        }}
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

                  {/* Kolom Aksi Lengkap (Edit, Bayar, Diskon, Pindah, Hapus) */}
                  <td className="px-5 py-4.5">
                    <div className="flex items-center justify-center gap-1.5 text-[13px]">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-100 font-semibold text-slate-700 transition-colors"
                        title="Edit Data Penghuni"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateTenant({ ...item, statusBayar: "Lunas" });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#1E3A8A] text-white hover:bg-blue-900 font-bold transition-colors"
                        title="Tandai Bayar / Lunas"
                      >
                        Bayar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountTenant(item);
                          setDiscountAmount(0);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold transition-colors"
                        title="Beri Diskon Sewa"
                      >
                        Diskon
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMovingTenant(item);
                          setMoveRoomId("");
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-100 font-semibold text-slate-700 transition-colors"
                        title="Pindah Kamar"
                      >
                        Pindah
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckoutConfirm(item)}
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

          {filtered.length === 0 && (
            <div className="py-16 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-[15px] font-semibold">Tidak ada data penyewa yang sesuai.</p>
            </div>
          )}
        </div>
      </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
            <div className={`w-full max-w-lg rounded-2xl shadow-2xl border max-h-[90vh] overflow-y-auto ${dm ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              }`}>
              <div className={`flex items-center justify-between px-6 py-5 border-b ${dm ? "border-slate-700" : "border-slate-100"}`}>
                <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  {editTenant ? "Edit Data Penyewa" : "Daftarkan Penyewa Baru"}
                </h3>
                <button onClick={() => setShowModal(false)} className={`p-2 rounded-lg ${dm ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: "Nama Lengkap", key: "nama", placeholder: "Nama sesuai KTP" },
                  { label: "NIK (16 digit)", key: "nik", placeholder: "3171012904990001" },
                  { label: "No. WhatsApp", key: "phone", placeholder: "0812XXXXXXXX" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-[13px] font-bold mb-1.5">{label}</label>
                    <input
                      value={(form as Record<string, unknown>)[key] as string}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder}
                      className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 ${dm ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500" : "bg-slate-50 border-slate-200"
                        }`}
                    />
                  </div>
                ))}

                {!editTenant && (
                  <div>
                    <label className="block text-[13px] font-bold mb-1.5">Pilih Kamar</label>
                    <select
                      value={form.roomId}
                      onChange={(e) => {
                        const room = rooms.find((r: Room) => r.id === e.target.value);
                        setForm({
                          ...form,
                          roomId: e.target.value,
                          roomNumber: room ? room.number : "",
                          biayaSewa: room ? room.price : 0,
                        });
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none ${dm ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-slate-50 border-slate-200"
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
                      value={form.tanggalMasuk}
                      onChange={(e) => setForm({ ...form, tanggalMasuk: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none ${dm ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-slate-50 border-slate-200"
                        }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold mb-1.5">Jatuh Tempo</label>
                    <input
                      type="date"
                      value={form.jatuhTempo}
                      onChange={(e) => setForm({ ...form, jatuhTempo: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none ${dm ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-slate-50 border-slate-200"
                        }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold mb-1.5">Deposit (Rp)</label>
                  <input
                    type="number"
                    value={form.deposit}
                    onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none ${dm ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-slate-50 border-slate-200"
                      }`}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold mb-1.5">URL Foto KTP (opsional)</label>
                  <input
                    value={form.ktpImage ?? ""}
                    onChange={(e) => setForm({ ...form, ktpImage: e.target.value })}
                    placeholder="https://..."
                    className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none ${dm ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500" : "bg-slate-50 border-slate-200"
                      }`}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold mb-1.5">Catatan</label>
                  <textarea
                    rows={2}
                    value={form.catatan ?? ""}
                    onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                    placeholder="Informasi tambahan tentang penyewa..."
                    className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none resize-none ${dm ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500" : "bg-slate-50 border-slate-200"
                      }`}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className={`flex-1 py-3 rounded-xl font-bold text-[14px] border transition-colors ${dm ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-3 rounded-xl font-bold text-[14px] bg-[#1E3A8A] text-white hover:bg-blue-800 transition-colors"
                  >
                    {editTenant ? "Simpan Perubahan" : "Daftarkan Penyewa"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Move Room Modal */}
        {movingTenant && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
            <div className={`w-full max-w-sm rounded-2xl shadow-2xl border p-6 ${dm ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              }`}>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Pindah Kamar — {movingTenant.nama}
              </h3>
              <p className={`text-[13px] mb-3 ${dm ? "text-slate-400" : "text-slate-500"}`}>
                Kamar saat ini: <strong>Kamar {movingTenant.roomNumber}</strong>
              </p>
              <label className="block text-[13px] font-bold mb-1.5">Pilih Kamar Tujuan</label>
              <select
                value={moveRoomId}
                onChange={(e) => setMoveRoomId(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none mb-4 ${dm ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-slate-50 border-slate-200"
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
                <button onClick={() => setMovingTenant(null)} className={`flex-1 py-2.5 rounded-xl font-bold text-[14px] border ${dm ? "border-slate-600 text-slate-300" : "border-slate-300 text-slate-600"}`}>Batal</button>
                <button
                  onClick={handleMove}
                  disabled={!moveRoomId}
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

        {/* Discount Modal */}
        {discountTenant && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
            <div className={`w-full max-w-sm rounded-2xl shadow-2xl border p-6 ${dm ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              }`}>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Beri Diskon — {discountTenant.nama}
              </h3>
              <p className={`text-[13px] mb-3 ${dm ? "text-slate-400" : "text-slate-500"}`}>
                Tarif sewa saat ini: <strong>{formatRupiah(discountTenant.biayaSewa)}/bln</strong>
              </p>
              <label className="block text-[13px] font-bold mb-1.5">Jumlah Potongan (Rp)</label>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className={`w-full px-3 py-2.5 rounded-xl border text-[14px] focus:outline-none mb-4 ${dm ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-slate-50 border-slate-200"
                  }`}
              />
              {discountAmount > 0 && (
                <p className={`text-[13px] mb-3 ${dm ? "text-slate-400" : "text-slate-500"}`}>
                  Tarif setelah diskon: <strong className="text-emerald-600">{formatRupiah(discountTenant.biayaSewa - discountAmount)}/bln</strong>
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setDiscountTenant(null)} className={`flex-1 py-2.5 rounded-xl font-bold text-[14px] border ${dm ? "border-slate-600 text-slate-300" : "border-slate-300 text-slate-600"}`}>Batal</button>
                <button
                  onClick={handleDiscount}
                  disabled={discountAmount <= 0}
                  className="flex-1 py-2.5 rounded-xl font-bold text-[14px] bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  Terapkan Diskon
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Confirm */}
        {checkoutConfirm && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
            <div className={`w-full max-w-sm rounded-2xl shadow-2xl border p-6 ${dm ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              }`}>
              <div className="w-14 h-14 mx-auto bg-red-100 dark:bg-red-950 rounded-2xl flex items-center justify-center mb-4">
                <LogOut className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Konfirmasi Check-out
              </h3>
              <p className={`text-[14px] text-center mb-5 ${dm ? "text-slate-400" : "text-slate-500"}`}>
                Apakah Anda yakin ingin melakukan check-out untuk <strong>{checkoutConfirm.nama}</strong> dari Kamar {checkoutConfirm.roomNumber}? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setCheckoutConfirm(null)} className={`flex-1 py-2.5 rounded-xl font-bold border ${dm ? "border-slate-600 text-slate-300" : "border-slate-300 text-slate-600"}`}>Batal</button>
                <button
                  onClick={() => { checkoutTenant(checkoutConfirm.id); setCheckoutConfirm(null); }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-[14px] bg-red-600 text-white hover:bg-red-700"
                >
                  Ya, Check-out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* KTP Modal */}
        {ktpTenant && (
          <KtpModal
            isOpen={showKtp}
            tenantName={ktpTenant.nama}
            nik={ktpTenant.nik}
            imageUrl={ktpTenant.ktpImage}
            onClose={() => { setShowKtp(false); setKtpTenant(null); }}
          />
        )}
      </div>
  );
}
