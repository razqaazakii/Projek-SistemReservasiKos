'use client';

import React, { useActionState, useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { roomsData } from '@/data/roomsData';
import { getAuthUser, AuthUser } from '@/lib/auth';
import { createBookingAction } from '@/actions/booking';
import type { ActionResponse } from '@/types/room';

// Nilai awal status form sesuai konvensi Modul 5
const awal: ActionResponse = { success: false, message: '' };

function BookingFormInner() {
  const searchParams = useSearchParams();
  const queryRoomId = searchParams.get('roomId');

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [roomId, setRoomId] = useState<string>(
    queryRoomId && roomsData.some((r) => r.id === queryRoomId)
      ? queryRoomId
      : roomsData[0]?.id || ''
  );
  const [duration, setDuration] = useState<number>(1);

  // Ambil data akun yang sedang login untuk auto pre-fill formulir
  useEffect(() => {
    const user = getAuthUser();
    if (user) setCurrentUser(user);
  }, []);

  // Sinkronkan pilihan kamar jika query param ?roomId berubah dari katalog
  useEffect(() => {
    if (queryRoomId && roomsData.some((r) => r.id === queryRoomId)) {
      setRoomId(queryRoomId);
    }
  }, [queryRoomId]);

  // Hook resmi React 19 / Next.js sesuai Modul 5
  const [status, aksi, pending] = useActionState(createBookingAction, awal);

  // Ekstrak galat (Zod field-level) dan nilai lama (agar form tidak reset)
  const g = status?.galat || status?.errors;
  const n = status?.nilai;

  // Update state lokal jika server mengembalikan nilai lama setelah validasi gagal
  useEffect(() => {
    if (n?.duration) setDuration(Number(n.duration));
    if (n?.roomId) setRoomId(n.roomId);
  }, [n]);

  // Hitung estimasi biaya sewa realtime di sisi klien (lengkap dengan diskon)
  const selectedRoom = useMemo(
    () => roomsData.find((r) => r.id === roomId) || roomsData[0],
    [roomId]
  );

  const estimatedPrice = useMemo(() => {
    const base = (selectedRoom?.price || 0) * duration;
    let discount = 0;
    if (duration === 3) discount = 0.05;
    if (duration === 6) discount = 0.1;
    if (duration === 12) discount = 0.15;
    return base * (1 - discount);
  }, [selectedRoom, duration]);

  // Tanggal minimal: Hari ini (format YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  // JIKA FORM BERHASIL DISIMPAN: TAMPILKAN BUKTI TIKET RESERVASI RESMI
  if (status?.success) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-md text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ✓
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-2">
            Status: Menunggu Konfirmasi Pengelola (PENDING)
          </span>
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Pengajuan Reservasi Berhasil!
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Data pemesanan Anda telah berhasil disimpan secara persisten ke database PostgreSQL (3NF).
          </p>

          {/* Rincian Tiket Booking */}
          <div className="p-5 bg-slate-50 rounded-xl text-left text-xs space-y-3 border border-slate-200 mb-6 font-mono">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Nama Pemesan:</span>
              <strong className="text-slate-800">{n?.fullName}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Kamar Dipilih:</span>
              <strong className="text-slate-800">{selectedRoom?.name}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Rencana Check-in:</span>
              <strong className="text-slate-800">{n?.checkInDate}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Durasi Sewa:</span>
              <strong className="text-slate-800">{duration} Bulan</strong>
            </div>
            <div className="flex justify-between items-center pt-1 text-sm font-sans font-bold">
              <span className="text-slate-900">Total Biaya Sewa:</span>
              <span className="text-blue-700 text-base">Rp {estimatedPrice.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 text-left mb-6">
            ℹ️ Pengelola kos akan menghubungi kontak WhatsApp Anda untuk verifikasi identitas (KTP) dan penyerahan kunci kamar.
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
            >
              Cetak Tiket (PDF)
            </button>
            <Link
              href="/rooms"
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
            >
              Kembali ke Katalog
            </Link>
            <Link
              href="/dashboard/penyewa"
              className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
            >
              Buka Dasbor
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN FORMULIR BOOKING UTAMA
  return (
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Ajukan Reservasi Sewa (Request-to-Book)
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Lengkapi data diri dan kamar pilihan Anda. Sistem menerapkan validasi server dengan Zod dan menyimpan ke PostgreSQL.
        </p>
      </div>

      {/* Banner Sesi Akun Aktif */}
      {currentUser && (
        <div className="mb-6 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
          <span>Masuk sebagai: <strong>{currentUser.name}</strong> ({currentUser.email})</span>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Akun Aktif</span>
        </div>
      )}

      {/* Pesan Kesalahan Umum Server */}
      {status?.pesan && !status.success && (
        <div role="alert" className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          ⚠️ {status.pesan}
        </div>
      )}

      <form action={aksi} className="space-y-5 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">

        {/* 1. Pilih Kamar Kos (Zod: roomId) */}
        <div>
          <label htmlFor="roomId" className="block text-sm font-semibold text-slate-700 mb-1">
            Pilih Kamar Kos <span className="text-red-500">*</span>
          </label>
          <select
            id="roomId"
            name="roomId"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            aria-invalid={!!g?.roomId}
            aria-describedby="galat-roomId"
          >
            {roomsData.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} — Rp {room.price.toLocaleString('id-ID')} / bulan ({room.type})
              </option>
            ))}
          </select>
          {g?.roomId && (
            <p id="galat-roomId" className="mt-1 text-xs text-red-600 font-medium">
              {g.roomId[0]}
            </p>
          )}
        </div>

        {/* 2. Nama Lengkap (Zod: fullName) */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-1">
            Nama Lengkap Sesuai KTP <span className="text-red-500">*</span>
          </label>
          <input
            id="fullName"
            type="text"
            name="fullName"
            defaultValue={n?.fullName ?? currentUser?.name ?? ''}
            placeholder="Contoh: Ahmad Fauzi"
            className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
            aria-invalid={!!g?.fullName}
            aria-describedby="galat-fullName"
          />
          {g?.fullName && (
            <p id="galat-fullName" className="mt-1 text-xs text-red-600 font-medium">
              {g.fullName[0]}
            </p>
          )}
        </div>

        {/* 3. Alamat Email (Zod: email) */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
            Alamat Email Aktif <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            defaultValue={n?.email ?? currentUser?.email ?? ''}
            placeholder="user@domain.com"
            className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
            aria-invalid={!!g?.email}
            aria-describedby="galat-email"
          />
          {g?.email && (
            <p id="galat-email" className="mt-1 text-xs text-red-600 font-medium">
              {g.email[0]}
            </p>
          )}
        </div>

        {/* 4. Nomor WhatsApp (Zod: whatsapp) */}
        <div>
          <label htmlFor="whatsapp" className="block text-sm font-semibold text-slate-700 mb-1">
            Nomor WhatsApp Aktif <span className="text-red-500">*</span>
          </label>
          <input
            id="whatsapp"
            type="tel"
            name="whatsapp"
            defaultValue={n?.whatsapp ?? currentUser?.phone ?? ''}
            placeholder="Contoh: 081234567890"
            className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
            aria-invalid={!!g?.whatsapp}
            aria-describedby="galat-whatsapp"
          />
          {g?.whatsapp && (
            <p id="galat-whatsapp" className="mt-1 text-xs text-red-600 font-medium">
              {g.whatsapp[0]}
            </p>
          )}
        </div>

        {/* 5. Tanggal Check-in (Zod: checkInDate) */}
        <div>
          <label htmlFor="checkInDate" className="block text-sm font-semibold text-slate-700 mb-1">
            Rencana Tanggal Mulai Masuk (Check-in) <span className="text-red-500">*</span>
          </label>
          <input
            id="checkInDate"
            type="date"
            name="checkInDate"
            min={today}
            defaultValue={n?.checkInDate ?? ''}
            className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
            aria-invalid={!!g?.checkInDate}
            aria-describedby="galat-checkInDate"
          />
          {g?.checkInDate && (
            <p id="galat-checkInDate" className="mt-1 text-xs text-red-600 font-medium">
              {g.checkInDate[0]}
            </p>
          )}
        </div>

        {/* 6. Durasi Sewa (Zod: duration -> 1, 3, 6, 12) */}
        <div>
          <label htmlFor="duration" className="block text-sm font-semibold text-slate-700 mb-1">
            Pilihan Durasi Sewa <span className="text-red-500">*</span>
          </label>
          <select
            id="duration"
            name="duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            aria-invalid={!!g?.duration}
            aria-describedby="galat-duration"
          >
            <option value={1}>1 Bulan (Harga Normal)</option>
            <option value={3}>3 Bulan (Hemat Diskon 5%)</option>
            <option value={6}>6 Bulan (Hemat Diskon 10%)</option>
            <option value={12}>12 Bulan / 1 Tahun (Hemat Diskon 15%)</option>
          </select>
          {g?.duration && (
            <p id="galat-duration" className="mt-1 text-xs text-red-600 font-medium">
              {g.duration[0]}
            </p>
          )}
        </div>

        {/* 7. Catatan Tambahan (Zod: notes) */}
        <div>
          <label htmlFor="notes" className="block text-sm font-semibold text-slate-700 mb-1">
            Catatan Tambahan (Opsional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={n?.notes ?? ''}
            placeholder="Contoh: Rencana tiba pukul 14:00 WIB, membawa 1 unit motor."
            className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
            aria-invalid={!!g?.notes}
            aria-describedby="galat-notes"
          />
          {g?.notes && (
            <p id="galat-notes" className="mt-1 text-xs text-red-600 font-medium">
              {g.notes[0]}
            </p>
          )}
        </div>

        {/* Ringkasan Estimasi Biaya */}
        <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-200">
          <div>
            <span className="text-[11px] uppercase text-slate-500 font-bold tracking-wider block">
              Total Estimasi Biaya Sewa
            </span>
            <p className="text-2xl font-black text-blue-700">
              Rp {estimatedPrice.toLocaleString('id-ID')}
            </p>
          </div>
          <span className="text-xs text-slate-500 text-right">
            Dihitung & divalidasi aman di server
          </span>
        </div>

        {/* Tombol Submit & Status */}
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 text-sm shadow-sm"
        >
          {pending ? 'Memvalidasi & Menyimpan ke Database...' : 'Ajukan Reservasi Sekarang'}
        </button>

        <p role="status" aria-live="polite" className="text-xs text-center text-slate-500">
          {pending ? 'Sedang memproses permintaan formulir...' : ''}
        </p>
      </form>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-12 text-center text-sm text-slate-500">Memuat formulir pemesanan...</div>}>
      <BookingFormInner />
    </Suspense>
  );
}