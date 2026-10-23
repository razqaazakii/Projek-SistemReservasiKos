'use client';

import React, { useState } from 'react';
import { roomsData } from '@/data/roomsData';
import { Room, BookingFormData, BookingFormErrors } from '@/types/room';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';
import Badge from '@/components/ui/Badge';

interface ReservationFormProps {
  initialRoomId?: string;
  onSuccess?: (data: BookingFormData) => void;
}

export default function ReservationForm({
  initialRoomId,
  onSuccess,
}: ReservationFormProps) {
  const defaultRoomId =
    initialRoomId && roomsData.some((r: Room) => r.id === initialRoomId)
      ? initialRoomId
      : roomsData[0]?.id || '';

  const [formData, setFormData] = useState<BookingFormData>({
    roomId: defaultRoomId,
    fullName: '',
    email: '',
    whatsapp: '',
    checkInDate: '',
    duration: 1,
    notes: '',
  });

  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [confirmedData, setConfirmedData] = useState<BookingFormData | null>(null);

  const durationOptions = [
    { label: '1 Bulan', value: 1 },
    { label: '3 Bulan (Diskon 5%)', value: 3 },
    { label: '6 Bulan (Diskon 10%)', value: 6 },
    { label: '12 Bulan (Diskon 15% - Paling Hemat)', value: 12 },
  ];

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
    const finalValue = name === 'duration' ? Number(value) : value;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const errorMsg = validateField(name as keyof BookingFormData, finalValue);
    setErrors((prev) => ({
      ...prev,
      [name]: errorMsg,
    }));
  };

  // Mencari data kamar terpilih dengan tipe eksplisit Room pada callback
  const selectedRoom: Room | undefined = roomsData.find(
    (r: Room) => r.id === formData.roomId
  ) || roomsData[0];

  const calculateTotal = (): number => {
    if (!selectedRoom) return 0;
    const base = selectedRoom.price * formData.duration;
    let discount = 0;
    if (formData.duration === 3) discount = 0.05;
    if (formData.duration === 6) discount = 0.1;
    if (formData.duration === 12) discount = 0.15;
    return base * (1 - discount);
  };

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    const hasError = Object.values(newErrors).some((err) => Boolean(err));
    if (hasError) return;

    setConfirmedData({ ...formData });
    setIsSubmitted(true);
    if (onSuccess) {
      onSuccess(formData);
    }
  };

  const todayString = new Date().toISOString().split('T')[0];

  if (isSubmitted && confirmedData && selectedRoom) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
            ✓
          </div>
          <div>
            <h3 className="text-xl font-bold text-emerald-950">
              Pengajuan Reservasi Berhasil!
            </h3>
            <p className="text-sm text-emerald-800">
              Pengelola R-Stay akan segera menghubungi Anda untuk konfirmasi serah terima kunci.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-emerald-100 space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-slate-500 block">Kamar Pilihan:</span>
              <strong className="text-slate-900">{selectedRoom.name}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Nama Pemesan:</span>
              <strong className="text-slate-900">{confirmedData.fullName}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">WhatsApp:</span>
              <strong className="text-slate-900">{confirmedData.whatsapp}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Email:</span>
              <strong className="text-slate-900">{confirmedData.email}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Tanggal Check-In:</span>
              <strong className="text-slate-900">{confirmedData.checkInDate}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Durasi Sewa:</span>
              <strong className="text-slate-900">{confirmedData.duration} Bulan</strong>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
            <span className="font-semibold text-slate-700">Total Biaya Sewa:</span>
            <span className="text-lg font-bold text-blue-700">
              {formatCurrency(calculateTotal())}
            </span>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-emerald-300 text-emerald-900 hover:bg-emerald-100"
            onClick={() => setIsSubmitted(false)}
          >
            Buat Reservasi Baru
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pilihan Kamar Kos */}
      <div>
        <label
          htmlFor="roomId"
          className="block text-sm font-semibold text-slate-700 mb-1"
        >
          Pilih Unit Kamar Kos <span className="text-red-500">*</span>
        </label>
        <select
          id="roomId"
          name="roomId"
          value={formData.roomId}
          onChange={handleInputChange}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          {roomsData.map((room: Room) => (
            <option key={room.id} value={room.id}>
              {room.name} — {formatCurrency(room.price)}/bln ({room.type})
            </option>
          ))}
        </select>
      </div>

      {/* Ringkasan Kamar Terpilih */}
      {selectedRoom && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium">Unit Terpilih:</p>
            <p className="text-sm font-bold text-slate-900">{selectedRoom.name}</p>
            <p className="text-xs text-slate-600">{selectedRoom.location}</p>
          </div>
          <Badge variant={selectedRoom.type === 'Putri' ? 'putri' : selectedRoom.type === 'Putra' ? 'putra' : 'campur'}>
            {selectedRoom.type}
          </Badge>
        </div>
      )}

      {/* Nama Lengkap */}
      <InputField
        id="fullName"
        name="fullName"
        label="Nama Lengkap"
        placeholder="Masukkan nama sesuai KTP"
        value={formData.fullName}
        onChange={handleInputChange}
        onBlur={handleBlur}
        required
        error={errors.fullName}
      />

      {/* Email & WhatsApp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          id="email"
          name="email"
          label="Alamat Email"
          type="email"
          placeholder="nama@email.com"
          value={formData.email}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          error={errors.email}
        />

        <InputField
          id="whatsapp"
          name="whatsapp"
          label="Nomor WhatsApp"
          type="tel"
          placeholder="081234567890"
          value={formData.whatsapp}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          error={errors.whatsapp}
          helperText="Untuk konfirmasi dan serah terima kunci."
        />
      </div>

      {/* Tanggal Masuk & Durasi Sewa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        />

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
        />
      </div>

      {/* Catatan Tambahan */}
      <InputField
        id="notes"
        name="notes"
        label="Catatan Tambahan (Opsional)"
        type="textarea"
        placeholder="Contoh: Perkiraan check-in pukul 14:00 WIB, membawa 1 unit motor."
        value={formData.notes || ''}
        onChange={handleInputChange}
        rows={3}
      />

      {/* Total Biaya & Tombol Submit */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500 block">Estimasi Total:</span>
          <span className="text-xl font-bold text-blue-700">
            {formatCurrency(calculateTotal())}
          </span>
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold"
        >
          Ajukan Reservasi
        </Button>
      </div>
    </form>
  );
}

export { ReservationForm };
