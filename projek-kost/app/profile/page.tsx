'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthUser, setAuthUser, getRegisteredUsers, AuthUser } from '@/lib/auth';
import { getUserReservationsAction } from '@/actions/booking';
import { updateUserProfileDbAction } from '@/actions/auth';

interface UserReservation {
  id: string;
  checkInDate: Date | string;
  durationMonths: number;
  totalPrice: number;
  status: string;
  room?: {
    name: string;
    location: string;
    price: number;
  } | null;
}

function getInitials(name: string): string {
  if (!name) return 'RA';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateValue: string | Date): string {
  const d = new Date(dateValue);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [reservations, setReservations] = useState<UserReservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState({
    nik: '3201234567890001',
    username: 'razqaazaki55',
    name: '',
    email: '',
    phone: '081234567890',
    avatarUrl: '',
    fileName: 'foto_profil_resmi.jpg',
  });
  const [initialFormData, setInitialFormData] = useState({
    nik: '3201234567890001',
    username: 'razqaazaki55',
    name: '',
    email: '',
    phone: '081234567890',
    avatarUrl: '',
    fileName: 'foto_profil_resmi.jpg',
  });

  // Edit Mode State (Keterangan status diedit hanya muncul saat mode edit aktif)
  const [isEditing, setIsEditing] = useState(false);

  // Feedback State
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [photoNotice, setPhotoNotice] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    fileName?: string;
  } | null>(null);
  const [isNewPhotoSelected, setIsNewPhotoSelected] = useState(false);

  // Delete Photo Confirmation Modal State
  const [isDeletePhotoModalOpen, setIsDeletePhotoModalOpen] = useState(false);

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  useEffect(() => {
    setIsMounted(true);
    const currentUser = getAuthUser();
    if (!currentUser) {
      router.push('/login?redirect=/profile');
      return;
    }

    setUser(currentUser);
    const initial = {
      nik: currentUser.nik || currentUser.nim || '3201234567890001',
      username: currentUser.username || currentUser.usernameSSO || (currentUser.email ? currentUser.email.split('@')[0] : 'razqaazaki55'),
      name: currentUser.name || 'Razqa Azaki',
      email: currentUser.email || '',
      phone: currentUser.phone || '081234567890',
      avatarUrl: currentUser.avatarUrl || '',
      fileName: currentUser.avatarUrl ? 'foto_profil_kustom.jpg' : 'foto_profil_resmi.jpg',
    };
    setFormData(initial);
    setInitialFormData(initial);

    // Ambil riwayat reservasi pengguna dari PostgreSQL (ReBAC)
    setIsLoadingReservations(true);
    getUserReservationsAction(currentUser.email)
      .then((res) => {
        if (res.success && res.data) {
          setReservations(res.data as unknown as UserReservation[]);
        }
      })
      .finally(() => {
        setIsLoadingReservations(false);
      });
  }, [router]);

  // Handle Form Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle File Upload (Avatar) dengan validasi & notifikasi interaktif
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validasi Tipe Berkas (Hanya Gambar)
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    const validExtensions = /\.(jpe?g|png|webp|gif)$/i;
    if (!validMimes.includes(file.type) && !validExtensions.test(file.name)) {
      setPhotoNotice({
        type: 'error',
        message: 'Format file tidak didukung. Harap pilih foto berformat JPG, PNG, atau WebP.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validasi Ukuran Berkas (Maksimal 3 MB)
    const MAX_SIZE_BYTES = 3 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setPhotoNotice({
        type: 'error',
        message: `Ukuran file terlalu besar (${(file.size / (1024 * 1024)).toFixed(1)} MB). Batas maksimal ukuran foto adalah 3 MB.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 3. Konversi ke Base64 Data URL & Update Pratinjau
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData((prev) => ({
        ...prev,
        avatarUrl: base64String,
        fileName: file.name,
      }));
      setIsNewPhotoSelected(true);
      setIsEditing(true);

      // Notifikasi Feedback Sukses Unggah Foto Baru
      setPhotoNotice({
        type: 'success',
        fileName: file.name,
        message: `Foto "${file.name}" berhasil diunggah ke pratinjau! Klik "Simpan Perubahan" atau "Simpan Sekarang" agar aktif di akun Anda.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Batalkan pilihan foto baru (kembalikan ke foto sebelumnya)
  const handleCancelNewPhoto = () => {
    setFormData((prev) => ({
      ...prev,
      avatarUrl: initialFormData.avatarUrl,
      fileName: initialFormData.fileName,
    }));
    setIsNewPhotoSelected(false);
    setPhotoNotice({
      type: 'info',
      message: 'Pilihan foto baru dibatalkan. Foto profil dikembalikan seperti semula.',
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setPhotoNotice(null), 3000);
  };

  // Konfirmasi Hapus Foto Profil Permanen (kembali ke inisial default)
  const handleConfirmDeletePhoto = () => {
    if (!user) return;

    const updatedUser: AuthUser = {
      ...user,
      avatarUrl: '',
    };

    // 1. Simpan ke AuthUser session localStorage
    setAuthUser(updatedUser);
    setUser(updatedUser);

    // 2. Simpan ke database terdaftar (rstay_registered_users)
    try {
      const registered = getRegisteredUsers();
      const idx = registered.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
      if (idx !== -1) {
        registered[idx] = {
          ...registered[idx],
          avatarUrl: '',
        };
        localStorage.setItem('rstay_registered_users', JSON.stringify(registered));
      }
    } catch (err) {
      console.warn('Failed to delete photo from registered users:', err);
    }

    // 3. Update local state
    setFormData((prev) => ({
      ...prev,
      avatarUrl: '',
      fileName: 'foto_profil_resmi.jpg',
    }));
    setInitialFormData((prev) => ({
      ...prev,
      avatarUrl: '',
      fileName: 'foto_profil_resmi.jpg',
    }));
    setIsNewPhotoSelected(false);
    setIsDeletePhotoModalOpen(false);
    setPhotoNotice(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  // Handle Hapus / Reset Foto Profil ke Inisial
  const handleRemovePhoto = () => {
    if (isNewPhotoSelected) {
      handleCancelNewPhoto();
    } else {
      setIsDeletePhotoModalOpen(true);
    }
  };

  // Handle Update Profile (Username, Nama, Email, WhatsApp, Avatar)
  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdating(true);

    const cleanName = formData.name.trim() || user.name;
    const cleanUsername = formData.username.trim() || user.username || (user.email ? user.email.split('@')[0] : 'penyewa');
    const cleanEmail = formData.email.trim().toLowerCase() || user.email;
    const cleanPhone = formData.phone.trim() || user.phone || '081234567890';

    const updatedUser: AuthUser = {
      ...user,
      name: cleanName,
      nik: formData.nik.trim(),
      username: cleanUsername,
      usernameSSO: cleanUsername, // sync for backwards compatibility
      email: cleanEmail,
      phone: cleanPhone,
      avatarUrl: formData.avatarUrl,
    };

    // 1. Simpan ke AuthUser session localStorage
    setAuthUser(updatedUser);
    setUser(updatedUser);

    // 2. Sinkronkan pembaruan data pengguna ke database PostgreSQL
    try {
      await updateUserProfileDbAction(user.email, {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
      });
    } catch (err) {
      console.warn('Update user profile db action warning:', err);
    }

    // 3. Simpan ke database terdaftar (rstay_registered_users)
    try {
      const registered = getRegisteredUsers();
      const idx = registered.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
      if (idx !== -1) {
        registered[idx] = {
          ...registered[idx],
          name: updatedUser.name,
          nik: updatedUser.nik,
          username: updatedUser.username,
          usernameSSO: updatedUser.username,
          email: updatedUser.email,
          phone: updatedUser.phone,
          avatarUrl: updatedUser.avatarUrl,
        };
        localStorage.setItem('rstay_registered_users', JSON.stringify(registered));
      }
    } catch (err) {
      console.warn('Failed to update registered users list:', err);
    }

    setTimeout(() => {
      setIsUpdating(false);
      setInitialFormData(formData);
      setIsEditing(false); // Selesai edit dan kembali ke tampilan bersih
      setIsNewPhotoSelected(false);
      setPhotoNotice(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4500);
    }, 400);
  };

  // Toggle Mode Edit Profil
  const handleToggleEdit = () => {
    if (isEditing) {
      // Batalkan edit: kembalikan ke data awal
      setFormData(initialFormData);
      setIsNewPhotoSelected(false);
      setPhotoNotice(null);
      setIsEditing(false);
    } else {
      setIsEditing(true);
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  // Handle Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({ type: null, message: '' });

    if (!passwordForm.oldPassword) {
      setPasswordStatus({ type: 'error', message: 'Kata sandi saat ini harus diisi.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }

    try {
      const registered = getRegisteredUsers();
      const idx = registered.findIndex((u) => u.email.toLowerCase() === user?.email.toLowerCase());

      if (idx !== -1) {
        if (registered[idx].password && registered[idx].password !== passwordForm.oldPassword) {
          setPasswordStatus({ type: 'error', message: 'Kata sandi saat ini tidak valid.' });
          return;
        }

        // Update kata sandi
        registered[idx].password = passwordForm.newPassword;
        localStorage.setItem('rstay_registered_users', JSON.stringify(registered));

        setPasswordStatus({ type: 'success', message: '✓ Kata sandi akun berhasil diperbarui!' });
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
          setPasswordStatus({ type: null, message: '' });
        }, 1500);
      } else {
        setPasswordStatus({ type: 'error', message: 'Akun tidak ditemukan di database lokal.' });
      }
    } catch {
      setPasswordStatus({ type: 'error', message: 'Gagal memperbarui kata sandi.' });
    }
  };

  if (!isMounted || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-500 flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Memeriksa status akun...
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';
  const displayInitials = getInitials(formData.name || user.name);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Breadcrumb Navigasi: 🏠 Beranda / Profil Pengguna */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/"
            className="hover:text-blue-600 flex items-center gap-1.5 transition-colors font-medium"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Beranda
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-blue-600 font-semibold">Profil Pengguna</span>
        </nav>

        {/* Notifikasi Berhasil Update Profil */}
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-xs transition-all animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span>
                Profil &amp; foto berhasil disimpan! Perubahan data akun Anda telah diperbarui ke sistem R-Stay.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccess(false)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Notifikasi Khusus Saat Baru Mengunggah / Memilih Foto Profil */}
        {photoNotice && (
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all animate-fadeIn ${
              photoNotice.type === 'success'
                ? 'bg-blue-50/95 border-blue-200 text-blue-900'
                : photoNotice.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
                  photoNotice.type === 'success'
                    ? 'bg-blue-600 text-white'
                    : photoNotice.type === 'error'
                    ? 'bg-rose-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {photoNotice.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : photoNotice.type === 'error' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    {photoNotice.type === 'success'
                      ? '📸 Foto Profil Baru Berhasil Dipilih!'
                      : photoNotice.type === 'error'
                      ? '⚠️ Gagal Memuat Foto Profil'
                      : 'ℹ️ Pembaruan Foto Profil'}
                  </p>
                  {photoNotice.type === 'success' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                      Pratinjau Aktif
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {photoNotice.message}
                </p>
              </div>
            </div>

            {/* Tombol Aksi Cepat pada Notifikasi Foto */}
            <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
              {photoNotice.type === 'success' && (
                <>
                  <button
                    type="button"
                    onClick={handleCancelNewPhoto}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Batalkan pilihan foto dan kembalikan foto sebelumnya"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Batalkan Pilihan
                  </button>

                  <button
                    type="button"
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    Simpan Sekarang
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setPhotoNotice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Tutup pemberitahuan"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* KARTU PROFIL UTAMA (SAMA PERSIS DENGAN GAMBAR CONTOH) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
          
          {/* Header Banner Biru Solid dengan Avatar dan Identitas */}
          <div className="bg-[#0055b8] px-6 py-6 sm:px-8 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar Bulat Besar dengan Kamera Cepat & Tombol Hapus */}
              <div className="relative group shrink-0">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white text-[#0055b8] font-black text-xl sm:text-2xl flex items-center justify-center shadow-md overflow-hidden border-2 border-white/80 ring-2 ring-white/20 transition-all">
                  {formData.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formData.avatarUrl}
                      alt={formData.name || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    displayInitials
                  )}
                </div>

                {/* Indikator Animasi jika ada foto baru belum disimpan */}
                {isNewPhotoSelected && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4" title="Foto baru terpilih dan belum disimpan">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white items-center justify-center text-[9px] text-white font-bold">
                      ✓
                    </span>
                  </span>
                )}

                {/* Tombol Aksi Kamera / Hapus pada Avatar */}
                <div className="absolute -bottom-1 -right-1 flex items-center gap-1">
                  {formData.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isNewPhotoSelected) {
                          handleCancelNewPhoto();
                        } else {
                          setIsDeletePhotoModalOpen(true);
                        }
                      }}
                      title={isNewPhotoSelected ? "Batalkan pilihan foto baru" : "Hapus foto profil"}
                      className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md border-2 border-white cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditing) setIsEditing(true);
                      fileInputRef.current?.click();
                    }}
                    title="Klik untuk memilih atau mengubah foto profil"
                    className="p-1.5 rounded-full bg-white text-blue-600 hover:bg-blue-50 shadow-md border-2 border-white cursor-pointer transition-transform hover:scale-110 active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Nama & Badge Peran Reservasi Kos */}
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                  {formData.name || user.name || 'Razqa Azaki'}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-white/20 text-white backdrop-blur-xs inline-block">
                    {isAdmin ? 'Pengelola Kos (Admin)' : 'Penyewa Kos'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Edit Profil Putih Outlined di Kanan Atas */}
            <button
              type="button"
              onClick={handleToggleEdit}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-semibold transition-all backdrop-blur-xs cursor-pointer self-start sm:self-center ${
                isEditing
                  ? 'bg-white/20 border-white text-white hover:bg-white/30'
                  : 'border-white/40 text-white hover:bg-white/10'
              }`}
            >
              {isEditing ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Batal Edit
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profil
                </>
              )}
            </button>
          </div>

          {/* Form Pengaturan Data Penghuni Kos (Badan Kartu) */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Judul Bagian: 👤 Informasi Data Penghuni Kos */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  {isAdmin ? 'Informasi Data Pengelola Kos' : 'Informasi Data Penghuni Kos'}
                </h2>
              </div>
              {isEditing ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                  ✏️ Mode Edit Aktif
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-400 hidden sm:inline-block">
                  Klik &ldquo;Edit Profil&rdquo; untuk memperbarui data
                </span>
              )}
            </div>

            {/* Banner Keterangan Kebijakan Edit Profil (Hanya Muncul Saat Pengguna Klik Edit Profil) */}
            {isEditing && (
              <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-2.5 animate-fadeIn shadow-2xs">
                <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="leading-relaxed">
                  <strong className="font-bold text-blue-900">Keterangan Kolom:</strong>{' '}
                  Kolom bertanda <span className="font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">✏️ Dapat Diedit</span> (Username, Nama Lengkap, Foto Profil, Email, No. WhatsApp) dapat Anda ubah dan simpan.{' '}
                  Kolom bertanda <span className="font-semibold text-slate-700 bg-slate-200/80 px-1.5 py-0.5 rounded">🔒 Terkunci</span> (NIK KTP) bersifat resmi permanen dari identitas KTP yang diverifikasi saat mendaftar.
                </div>
              </div>
            )}

            {/* Grid 2 Kolom Formulir Pengaturan Akun Kos (Sesuai Tampilan Asli) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Kolom 1 (Kiri Atas): NIK / No. Identitas KTP [TERKUNCI] */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    NIK / No. Identitas KTP
                  </label>
                  {isEditing && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1 animate-fadeIn">
                      🔒 Terkunci (Resmi)
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  name="nik"
                  value={formData.nik}
                  readOnly
                  disabled
                  title="NIK KTP resmi terverifikasi saat pendaftaran akun dan tidak dapat diubah sendiri."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-100/90 text-sm font-semibold text-slate-500 cursor-not-allowed select-none tracking-wider font-mono"
                />
                {isEditing && (
                  <p className="text-[10px] text-slate-400 mt-1 animate-fadeIn">
                    Nomor NIK identitas resmi diperoleh dari verifikasi E-KTP saat pendaftaran dan terkunci permanen demi validitas kontrak sewa kos.
                  </p>
                )}
              </div>

              {/* Kolom 2 (Kanan Atas): Username Akun [BISA DIEDIT] */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Username Akun
                  </label>
                  {isEditing && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 animate-fadeIn">
                      ✏️ Dapat Diedit
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                  placeholder="Masukkan username akun"
                  title="Username akun Anda untuk login dan tanda pengenal sistem."
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-all font-mono ${
                    isEditing
                      ? 'bg-white text-slate-900 border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs'
                      : 'bg-slate-50/70 text-slate-800 border-slate-200 cursor-default'
                  }`}
                />
                {isEditing && (
                  <p className="text-[10px] text-slate-500 mt-1 animate-fadeIn">
                    ID akun sistem R-Stay yang tampil pada menu navigasi akun.
                  </p>
                )}
              </div>

              {/* Kolom 1 (Kiri Tengah): Nama Lengkap [BISA DIEDIT] */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Nama Lengkap (Sesuai KTP)
                  </label>
                  {isEditing && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 animate-fadeIn">
                      ✏️ Dapat Diedit
                    </span>
                  )}
                </div>
                <input
                  ref={nameInputRef}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                  placeholder="Masukkan nama lengkap"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    isEditing
                      ? 'bg-white text-slate-900 border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs'
                      : 'bg-slate-50/70 text-slate-800 border-slate-200 cursor-default'
                  }`}
                />
                {isEditing && (
                  <p className="text-[10px] text-slate-500 mt-1 animate-fadeIn">
                    Dapat disesuaikan jika terdapat perbaikan ejaan nama atau penambahan gelar.
                  </p>
                )}
              </div>

              {/* Kolom 2 (Kanan Tengah): Foto Profil [BISA DIUBAH] */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Foto Profil Penghuni
                  </label>
                  {isEditing ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 animate-fadeIn">
                      📷 Dapat Diubah
                    </span>
                  ) : (
                    formData.avatarUrl && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        ✓ Terpasang
                      </span>
                    )
                  )}
                </div>
                
                {/* Kotak Upload Foto Profil */}
                <div className={`flex items-center justify-between px-3.5 py-2 rounded-lg border transition-all ${
                  isNewPhotoSelected
                    ? 'bg-blue-50/60 border-blue-400 ring-2 ring-blue-100 shadow-2xs'
                    : isEditing
                    ? 'bg-white border-blue-300 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 shadow-2xs">
                      {formData.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={formData.avatarUrl}
                          alt="Pratinjau Foto"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        displayInitials
                      )}
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-slate-800 font-mono truncate max-w-[130px] sm:max-w-[170px]">
                        {formData.fileName}
                      </span>
                      {isNewPhotoSelected ? (
                        <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                          ● Foto baru (belum disimpan)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {formData.avatarUrl ? 'Foto kustom aktif' : 'Inisial nama default'}
                        </span>
                      )}
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Tombol Aksi di Kanan Kotak */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Tombol Batal jika foto baru dipilih dan belum disimpan */}
                    {isNewPhotoSelected && (
                      <button
                        type="button"
                        onClick={handleCancelNewPhoto}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 flex items-center gap-1"
                        title="Batalkan foto baru yang dipilih"
                      >
                        <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Batal
                      </button>
                    )}

                    {/* Tombol Hapus Foto Profil (selalu bisa diakses jika ada foto profil) */}
                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer px-2 py-1 rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 flex items-center gap-1"
                        title="Hapus foto profil dan kembali ke inisial nama"
                      >
                        <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (!isEditing) setIsEditing(true);
                        fileInputRef.current?.click();
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors shrink-0 cursor-pointer px-2 py-1 rounded border border-blue-200 bg-blue-50/70 hover:bg-blue-100"
                    >
                      {formData.avatarUrl ? 'Ganti >' : 'Unggah >'}
                    </button>
                  </div>
                </div>
                {isEditing && (
                  <p className="text-[10px] text-slate-500 mt-1 animate-fadeIn flex items-center justify-between">
                    <span>Format: JPG, PNG, atau WebP (Maks. 3 MB).</span>
                    {isNewPhotoSelected && (
                      <span className="text-blue-600 font-semibold">
                        Klik &ldquo;Simpan Perubahan&rdquo;
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Kolom 1 (Kiri Bawah): Email Utama [BISA DIUBAH / DIPERBARUI] */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email Utama (Akun Reservasi)
                  </label>
                  {isEditing ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 animate-fadeIn">
                      ✏️ Dapat Diperbarui
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      ✓ Aktif
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    placeholder="nama@email.com"
                    title="Alamat email aktif untuk notifikasi reservasi dan login."
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-all font-mono ${
                      isEditing
                        ? 'bg-white text-slate-900 border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs'
                        : 'bg-slate-50/70 text-slate-800 border-slate-200 cursor-default pr-20'
                    }`}
                  />
                  {!isEditing && (
                    <div className="absolute right-2.5 flex items-center pointer-events-none">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                        Aktif
                      </span>
                    </div>
                  )}
                </div>
                {isEditing && (
                  <p className="text-[10px] text-slate-500 mt-1 animate-fadeIn">
                    Alamat email resmi untuk pengiriman kwitansi sewa kos dan kredensial login.
                  </p>
                )}
              </div>

              {/* Kolom 2 (Kanan Bawah): Nomor WhatsApp Aktif [BISA DIEDIT] */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Nomor WhatsApp Aktif
                  </label>
                  {isEditing && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 animate-fadeIn">
                      ✏️ Dapat Diperbarui
                    </span>
                  )}
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                  placeholder="Contoh: 081234567890"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-all font-mono ${
                    isEditing
                      ? 'bg-white text-slate-900 border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs'
                      : 'bg-slate-50/70 text-slate-800 border-slate-200 cursor-default'
                  }`}
                />
                {isEditing && (
                  <p className="text-[10px] text-slate-500 mt-1 animate-fadeIn">
                    Kontak utama pengelola untuk koordinasi serah terima kunci &amp; konfirmasi sewa.
                  </p>
                )}
              </div>

            </div>

            {/* Kotak Peringatan Keamanan Hijau R-Stay */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 mt-6">
              <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-xs text-emerald-900 leading-relaxed">
                <strong className="font-bold text-emerald-950">Status Keamanan Akun Terproteksi:</strong> Akun Anda terdaftar resmi pada Sistem Reservasi &amp; Manajemen Kos R-Stay. Seluruh data identitas penghuni, kontrak sewa, dan riwayat booking terlindungi dengan aman.
              </p>
            </div>

          </div>
        </div>

        {/* BARIS TOMBOL AKSI BAWAH */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Sisi Kiri: Update Profile & Change Password */}
          <div className="flex flex-wrap items-center gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleUpdateProfile}
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? (
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Simpan Perubahan
                </button>

                <button
                  type="button"
                  onClick={handleToggleEdit}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  ✕ Batal
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleToggleEdit}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profil
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Change Password
            </button>
          </div>

          {/* Sisi Kanan: Kembali ke Beranda */}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 text-xs font-medium transition-colors bg-white/70"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Beranda
          </Link>
        </div>

        {/* Panel Pintasan Pengelola (Khusus Admin) */}
        {isAdmin && (
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-6 shadow-sm space-y-3 mt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-indigo-950 flex items-center gap-2">
                  <span>🏢</span> Panel Khusus Pengelola Kos (Admin)
                </h2>
                <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                  Sebagai admin, Anda memiliki wewenang untuk melihat data penghuni, memvalidasi bukti KTP, mengatur kamar, serta mencatat status pembayaran sewa.
                </p>
              </div>
              <Link
                href="/dashboard/penyewa"
                className="shrink-0 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Buka Dashboard Master →
              </Link>
            </div>
          </div>
        )}

        {/* BAGIAN RIWAYAT PENGAJUAN RESERVASI SAYA (TETAP DIBAWAH KARTU PROFIL) */}
        {!isAdmin && (
          <div id="reservasi" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4 mt-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Riwayat Pengajuan Reservasi Saya
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar kamar kos yang diajukan dengan akun <span className="font-semibold text-slate-700">{user.email}</span>
                </p>
              </div>
              <Link
                href="/rooms"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
              >
                Cari Kamar Lain
              </Link>
            </div>

            {isLoadingReservations ? (
              <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Memuat data reservasi dari server...
              </div>
            ) : reservations.length > 0 ? (
              <div className="space-y-3">
                {reservations.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {res.room?.name || 'Kamar Kos R-Stay'}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            res.status === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : res.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {res.status === 'CONFIRMED'
                            ? '✓ Disetujui / Aktif'
                            : res.status === 'CANCELLED'
                            ? '✕ Ditolak'
                            : '⏳ Menunggu Konfirmasi'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        📍 {res.room?.location || 'Yogyakarta'}
                      </p>
                      <p className="text-xs text-slate-600">
                        Mulai sewa: <strong>{formatDate(res.checkInDate)}</strong> • Durasi: <strong>{res.durationMonths} Bulan</strong>
                      </p>
                      {res.status === 'CONFIRMED' && (
                        <p className="text-[11px] text-emerald-700 bg-emerald-50/70 rounded-md px-2 py-1 mt-1 border border-emerald-100 inline-block">
                          🎉 Permohonan Anda telah disetujui pengelola. Kunci kamar siap diambil pada tanggal mulai sewa.
                        </p>
                      )}
                    </div>

                    <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <p className="text-xs text-slate-500">Total Biaya:</p>
                      <p className="text-base font-extrabold text-blue-700">
                        {formatRupiah(res.totalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
                  📋
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Belum Ada Riwayat Reservasi</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Anda belum pernah mengajukan sewa kamar kos dengan email ini.
                  </p>
                </div>
                <Link
                  href="/rooms"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  Pilih Kamar Sekarang →
                </Link>
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL KONFIRMASI HAPUS FOTO PROFIL */}
      {isDeletePhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <h3 className="text-base font-bold text-slate-900">
                Hapus Foto Profil?
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                Foto profil Anda akan dihapus dan akun Anda akan kembali menggunakan inisial nama resmi (<strong className="text-slate-700 font-semibold">{displayInitials}</strong>). Anda dapat mengunggah foto baru kapan saja.
              </p>
            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeletePhotoModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePhoto}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Ya, Hapus Foto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHANGE PASSWORD */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 bg-amber-50/70 border-b border-amber-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-amber-950">Ubah Kata Sandi Akun</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordStatus({ type: null, message: '' });
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {passwordStatus.type && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    passwordStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {passwordStatus.message}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Kata Sandi Saat Ini
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  placeholder="Masukkan kata sandi lama"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Kata Sandi Baru (Min. 6 Karakter)
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Masukkan kata sandi baru"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  Simpan Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
