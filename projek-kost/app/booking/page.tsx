'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { roomsData } from '@/data/roomsData';
import { Room, BookingFormData, BookingFormErrors } from '@/types/room';
import { getAuthUser, AuthUser } from '@/lib/auth';
import InputField from '@/components/InputField';
import Button from '@/components/Button';
import Badge from '@/components/Badge';

function BookingFormContent() {
  const searchParams = useSearchParams();
  const queryRoomId = searchParams.get('roomId');
  const defaultRoomId =
    queryRoomId && roomsData.some((r: Room) => r.id === queryRoomId)
      ? queryRoomId
      : roomsData[0]?.id || '';

  const [userRoomId, setUserRoomId] = useState<string>('');
  const selectedRoomId = userRoomId || defaultRoomId;

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  const [formData, setFormData] = useState<BookingFormData>(() => ({
    roomId: defaultRoomId,
    fullName: '',
    email: '',
    whatsapp: '',
    checkInDate: '',
    duration: 1,
    notes: '',
  }));

  // Pengecekan autentikasi & pre-fill otomatis
  useEffect(() => {
    const user = getAuthUser();
    setCurrentUser(user);
    setIsAuthChecking(false);
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
        whatsapp: prev.whatsapp || user.phone || '',
      }));
    }
  }, []);

  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [confirmedData, setConfirmedData] = useState<BookingFormData | null>(null);

  const selectedRoom = roomsData.find((r: Room) => r.id === selectedRoomId) || roomsData[0];

  // Opsi durasi sewa
  const durationOptions = [
    { label: '1 Bulan', value: 1 },
    { label: '3 Bulan (Diskon 5%)', value: 3 },
    { label: '6 Bulan (Diskon 10%)', value: 6 },
    { label: '12 Bulan (Diskon 15% - Paling Hemat)', value: 12 },
  ];

  // Validasi individual satu field
  const validateField = (
    name: keyof BookingFormData,
    value: string | number | undefined
  ): string => {
    switch (name) {
      case 'fullName':
        if (!value || typeof value !== 'string' || value.trim().length === 0) {
          return 'Nama lengkap wajib diisi.';
        }
        if (value.trim().length < 3) {
          return 'Nama lengkap minimal harus 3 karakter.';
        }
        return '';

      case 'email':
        if (!value || typeof value !== 'string' || value.trim().length === 0) {
          return 'Alamat email wajib diisi.';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          return 'Format alamat email tidak valid (contoh: user@domain.com).';
        }
        return '';

      case 'whatsapp':
        if (!value || typeof value !== 'string' || value.trim().length === 0) {
          return 'Nomor WhatsApp wajib diisi.';
        }
        const cleanPhone = value.replace(/[\s-]/g, '');
        const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,10}$/;
        if (!phoneRegex.test(cleanPhone)) {
          return 'Nomor WhatsApp harus valid (10-13 digit angka, contoh: 081234567890).';
        }
        return '';

      case 'checkInDate':
        if (!value) {
          return 'Tanggal mulai masuk wajib dipilih.';
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(value);
        if (selectedDate < today) {
          return 'Tanggal mulai masuk tidak boleh di masa lalu.';
        }
        return '';

      case 'duration':
        if (!value || Number(value) <= 0) {
          return 'Silakan pilih durasi sewa.';
        }
        return '';

      default:
        return '';
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const finalValue = name === 'duration' ? Number(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    if (touched[name]) {
      const errorMsg = validateField(name as keyof BookingFormData, finalValue);
      setErrors((prev) => ({
        ...prev,
        [name]: errorMsg,
      }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errorMsg = validateField(name as keyof BookingFormData, value);
    setErrors((prev) => ({
      ...prev,
      [name]: errorMsg,
    }));
  };

  const handleRoomSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roomId = e.target.value;
    setUserRoomId(roomId);
    setFormData((prev) => ({ ...prev, roomId }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi seluruh form
    const newErrors: BookingFormErrors = {
      fullName: validateField('fullName', formData.fullName),
      email: validateField('email', formData.email),
      whatsapp: validateField('whatsapp', formData.whatsapp),
      checkInDate: validateField('checkInDate', formData.checkInDate),
      duration: validateField('duration', formData.duration),
    };

    setErrors(newErrors);
    setTouched({
      fullName: true,
      email: true,
      whatsapp: true,
      checkInDate: true,
      duration: true,
    });

    const hasAnyError = Object.values(newErrors).some((msg) => Boolean(msg));

    if (!hasAnyError) {
      setConfirmedData({ ...formData });
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Tanggal hari ini format YYYY-MM-DD untuk atribut min input date
  const todayString = new Date().toISOString().split('T')[0];

  // Hitung perkiraan total biaya
  const calculateTotal = () => {
    if (!selectedRoom) return 0;
    const base = selectedRoom.price * Number(formData.duration);
    let discount = 0;
    if (formData.duration === 3) discount = 0.05;
    if (formData.duration === 6) discount = 0.1;
    if (formData.duration === 12) discount = 0.15;
    return base * (1 - discount);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);

  // Status pengecekan sesi autentikasi
  if (isAuthChecking) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-sm text-slate-500 flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Memverifikasi status akun Anda...
        </div>
      </div>
    );
  }

  // Gatekeeper: Pengguna belum login
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Akses Pengajuan Reservasi Dibatasi
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Anda harus <strong>masuk ke akun terlebih dahulu</strong> untuk mengajukan formulir reservasi kamar kos di R-Stay.
            </p>
          </div>

          {selectedRoom && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                {selectedRoom.type}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium">Kamar yang dipilih:</p>
                <p className="text-sm font-bold text-slate-900 truncate">{selectedRoom.name}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={`/login?redirect=${encodeURIComponent(
                queryRoomId ? `/booking?roomId=${queryRoomId}` : '/booking'
              )}`}
              className="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Masuk Sekarang
            </Link>
            <Link
              href={`/register?redirect=${encodeURIComponent(
                queryRoomId ? `/booking?roomId=${queryRoomId}` : '/booking'
              )}`}
              className="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
            >
              Daftar Akun Baru
            </Link>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
            >
              &larr; Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Banner Akun Aktif & Pre-filled Data */}
      {currentUser && !isSubmitted && (
        <div className="mb-8 p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-900">
                Masuk sebagai: {currentUser.name} ({currentUser.email})
              </p>
              <p className="text-slate-600 text-xs">
                Data identitas Anda telah otomatis diisikan pada formulir di bawah ini.
              </p>
            </div>
          </div>
          <Link
            href="/profile"
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 shrink-0 hover:underline hidden sm:inline-block"
          >
            Lihat Profil &rarr;
          </Link>
        </div>
      )}

      {/* Modal / Card Sukses Notifikasi */}
      {isSubmitted && confirmedData && selectedRoom && (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-dialog-title"
          className="mb-10 bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 sm:p-8 shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h2
                id="success-dialog-title"
                className="text-2xl font-extrabold text-emerald-950"
              >
                Pengajuan Reservasi Berhasil!
              </h2>
              <p className="mt-1 text-sm text-emerald-800">
                Data Anda telah tersimpan ke sistem. Pengelola kos akan segera menghubungi Anda melalui WhatsApp untuk verifikasi dan instruksi check-in.
              </p>

              {/* Rincian Konfirmasi */}
              <div className="mt-6 bg-white rounded-xl p-5 border border-emerald-200 text-sm text-slate-800 space-y-3">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Ringkasan Bukti Reservasi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 text-xs block">Kamar Pilihan:</span>
                    <strong className="text-slate-900">{selectedRoom.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Nama Pemesan:</span>
                    <strong className="text-slate-900">{confirmedData.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Nomor WhatsApp:</span>
                    <strong className="text-slate-900">{confirmedData.whatsapp}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Email:</span>
                    <strong className="text-slate-900">{confirmedData.email}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Tanggal Masuk:</span>
                    <strong className="text-slate-900">{confirmedData.checkInDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Durasi Sewa:</span>
                    <strong className="text-slate-900">{confirmedData.duration} Bulan</strong>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Estimasi Total Biaya:</span>
                  <span className="text-lg font-extrabold text-blue-700">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="px-5 py-2.5 bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  Kembali ke Katalog
                </Link>
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="border-emerald-300 text-emerald-900 hover:bg-emerald-100"
                >
                  Cetak / Simpan Bukti PDF
                </Button>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="px-4 py-2 text-sm text-emerald-800 underline hover:text-emerald-950 font-medium"
                >
                  Tutup Notifikasi
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Header Halaman */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Formulir Pengajuan Reservasi Kamar
        </h1>
        <p className="mt-1 text-sm sm:text-base text-slate-600">
          Lengkapi data diri dan preferensi sewa Anda dengan valid untuk mempercepat proses persetujuan oleh pengelola kos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Formulir Reservasi */}
        <section
          aria-labelledby="form-reservasi-heading"
          className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm"
        >
          <h2
            id="form-reservasi-heading"
            className="text-lg sm:text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3"
          >
            Informasi Pemesan & Masa Sewa
          </h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Pilihan Kamar Kos */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="room-select" className="text-sm font-semibold text-slate-900">
                Pilih Kamar Kos Target <span className="text-red-600">*</span>
              </label>
              <select
                id="room-select"
                value={selectedRoomId}
                onChange={handleRoomSelect}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-base focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {roomsData.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.type}) - {formatCurrency(room.price)}/bln
                  </option>
                ))}
              </select>
            </div>

            {/* Nama Lengkap */}
            <InputField
              id="fullName"
              name="fullName"
              label="Nama Lengkap Sesuai KTP"
              type="text"
              placeholder="Contoh: Muhammad Reza Mahendra"
              value={formData.fullName}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              error={errors.fullName}
              helperText="Minimal 3 karakter untuk verifikasi administrasi kos."
            />

            {/* Alamat Email */}
            <InputField
              id="email"
              name="email"
              label="Alamat Email Aktif"
              type="email"
              placeholder="contoh: reza.mahendra@gmail.com"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              error={errors.email}
              helperText="Bukti tagihan dan konfirmasi akan dikirimkan ke email ini."
            />

            {/* Nomor WhatsApp */}
            <InputField
              id="whatsapp"
              name="whatsapp"
              label="Nomor WhatsApp"
              type="tel"
              placeholder="Contoh: 081234567890"
              value={formData.whatsapp}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              error={errors.whatsapp}
              helperText="Gunakan nomor aktif untuk koordinasi serah terima kunci (10-13 digit angka)."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tanggal Mulai Masuk */}
              <InputField
                id="checkInDate"
                name="checkInDate"
                label="Tanggal Mulai Masuk"
                type="date"
                min={todayString}
                value={formData.checkInDate}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                error={errors.checkInDate}
                helperText="Tidak boleh tanggal di masa lalu."
              />

              {/* Durasi Sewa */}
              <InputField
                id="duration"
                name="duration"
                label="Durasi Sewa"
                type="select"
                value={formData.duration}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                options={durationOptions}
                error={errors.duration}
                helperText="Pilih paket durasi untuk potongan harga khusus."
              />
            </div>

            {/* Catatan Tambahan (Opsional) */}
            <InputField
              id="notes"
              name="notes"
              label="Catatan Tambahan (Opsional)"
              type="textarea"
              placeholder="Contoh: Perkiraan tiba pukul 14.00, membawa 1 unit mobil Avanza."
              value={formData.notes || ''}
              onChange={handleInputChange}
              rows={3}
              helperText="Tuliskan permintaan khusus kepada pemilik kos bila ada."
            />

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                className="py-3.5 text-base font-bold"
              >
                Kirim Pengajuan Reservasi
              </Button>
            </div>
          </form>
        </section>

        {/* Kolom Kanan: Ringkasan Kamar Terpilih */}
        <aside
          aria-labelledby="ringkasan-kamar-heading"
          className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm sticky top-24"
        >
          <h2
            id="ringkasan-kamar-heading"
            className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100"
          >
            Ringkasan Kamar Terpilih
          </h2>

          {selectedRoom && (
            <div className="space-y-4">
              <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <Image
                  src={selectedRoom.imageUrl}
                  alt={selectedRoom.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 400px"
                />
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge
                    variant={
                      selectedRoom.type === 'Putra'
                        ? 'putra'
                        : selectedRoom.type === 'Putri'
                        ? 'putri'
                        : 'campur'
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedRoom.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 text-slate-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                  </svg>
                  <span>{selectedRoom.location}</span>
                </p>
              </div>

              {/* Rincian Biaya */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Harga per Bulan:</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(selectedRoom.price)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Durasi Dipilih:</span>
                  <span className="font-semibold text-slate-900">
                    {formData.duration} Bulan
                  </span>
                </div>
                {formData.duration > 1 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Diskon Masa Sewa:</span>
                    <span className="font-semibold">
                      {formData.duration === 3
                        ? '5%'
                        : formData.duration === 6
                        ? '10%'
                        : '15%'}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-900">Estimasi Total:</span>
                  <span className="font-extrabold text-blue-700 text-base">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/rooms/${selectedRoom.id}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  Lihat rincian lengkap kamar ini →
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-600">
          Memuat formulir reservasi...
        </div>
      }
    >
      <BookingFormContent />
    </Suspense>
  );
}
