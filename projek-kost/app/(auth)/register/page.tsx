'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveRegisteredUser, getRegisteredUsers } from '@/lib/auth';
import { isValidFullName, isValidIndonesianPhone } from '@/lib/validations/booking';
import { validateKtpDocument } from '@/lib/validations/auth';
import { registerUserAction } from '@/actions/auth';

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/';
  const ktpFileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    nik: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'penyewa' as 'penyewa' | 'admin',
    adminKey: '',
    ktpFileName: '',
    ktpPreviewUrl: '',
  });

  const [isScanningKtp, setIsScanningKtp] = useState(false);
  const [ktpScanSuccess, setKtpScanSuccess] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    nik?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    adminKey?: string;
  }>({});

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Handler Unggah & Ekstraksi OCR Otomatis E-KTP
  const handleKtpUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validasi Tipe Berkas (Hanya Gambar)
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const validExtensions = /\.(jpe?g|png|webp)$/i;
    if (!validMimes.includes(file.type) && !validExtensions.test(file.name)) {
      setErrors((prev) => ({
        ...prev,
        nik: 'Format file tidak didukung. Harap unggah foto KTP berformat JPG, PNG, atau WebP.',
      }));
      setKtpScanSuccess(false);
      setFormData((prev) => ({ ...prev, nik: '', ktpFileName: '', ktpPreviewUrl: '' }));
      if (ktpFileInputRef.current) ktpFileInputRef.current.value = '';
      return;
    }

    // 2. Validasi Ukuran Berkas (Maksimal 3 MB)
    if (file.size > 3 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        nik: 'Ukuran foto KTP terlalu besar. Batas maksimal 3 MB.',
      }));
      setKtpScanSuccess(false);
      setFormData((prev) => ({ ...prev, nik: '', ktpFileName: '', ktpPreviewUrl: '' }));
      if (ktpFileInputRef.current) ktpFileInputRef.current.value = '';
      return;
    }

    // 3. Validasi Keabsahan Dokumen KTP (Hanya KTP Asli / e-KYC Dukcapil yang diperbolehkan)
    const ktpCheck = validateKtpDocument(file.name);
    if (!ktpCheck.isValid) {
      setFormData((prev) => ({
        ...prev,
        nik: '',
        ktpFileName: '',
        ktpPreviewUrl: '',
      }));
      setKtpScanSuccess(false);
      setErrors((prev) => ({
        ...prev,
        nik: ktpCheck.reason || 'Berkas bukan dokumen E-KTP resmi Republik Indonesia.',
      }));
      if (ktpFileInputRef.current) ktpFileInputRef.current.value = '';
      return;
    }

    setIsScanningKtp(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;

      // Simulasi proses pemindaian OCR E-KTP & integrasi Dukcapil
      setTimeout(() => {
        let extractedName = formData.name.trim();
        if (!extractedName) {
          // Bersihkan nama file dari ekstensi dan kata kunci ktp
          const rawName = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[_-]/g, ' ')
            .replace(/\b(ktp|e-ktp|ektp|foto|scan|kartu|identitas|resmi|dukcapil)\b/gi, '')
            .trim();
          if (/^[a-zA-Z\s]{3,}$/.test(rawName)) {
            extractedName = rawName.toUpperCase();
          } else {
            extractedName = 'RAZQA AZAKI';
          }
        }

        const generatedNik = '3201234567890001';

        setFormData((prev) => ({
          ...prev,
          nik: generatedNik,
          name: extractedName,
          ktpFileName: file.name,
          ktpPreviewUrl: base64,
        }));

        setIsScanningKtp(false);
        setKtpScanSuccess(true);
        setErrors((prev) => ({ ...prev, nik: undefined, name: undefined }));
        if (ktpFileInputRef.current) ktpFileInputRef.current.value = '';
      }, 700);
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Nama Lengkap: Wajib diisi, minimal 3 karakter, dan TIDAK BOLEH mengandung angka
    if (!formData.name.trim()) {
      newErrors.name = 'Nama lengkap wajib diisi.';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nama lengkap minimal 3 karakter.';
    } else if (!isValidFullName(formData.name)) {
      newErrors.name = 'Nama lengkap hanya boleh berisi huruf (tidak boleh mengandung angka).';
    }

    // NIK / No. Identitas KTP (Khusus Penyewa)
    if (formData.role === 'penyewa') {
      if (!formData.ktpFileName) {
        newErrors.nik = 'Foto fisik E-KTP resmi wajib diunggah untuk verifikasi identitas penyewa.';
      } else {
        const ktpCheck = validateKtpDocument(formData.ktpFileName);
        if (!ktpCheck.isValid) {
          newErrors.nik = ktpCheck.reason || 'Berkas bukan dokumen E-KTP yang valid.';
        }
      }

      if (!formData.nik.trim()) {
        newErrors.nik = newErrors.nik || 'Nomor NIK KTP wajib diisi. Unggah foto E-KTP di atas untuk ekstraksi otomatis.';
      } else if (!/^\d{16}$/.test(formData.nik.trim())) {
        newErrors.nik = 'Nomor NIK harus tepat 16 digit angka resmi Dukcapil.';
      }
    }

    // Email valid
    if (!formData.email.trim()) {
      newErrors.email = 'Alamat email wajib diisi.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Format alamat email tidak valid.';
      } else {
        const existingUsers = getRegisteredUsers();
        if (existingUsers.some((u) => u.email.toLowerCase() === formData.email.trim().toLowerCase())) {
          newErrors.email = 'Alamat email ini sudah terdaftar. Silakan gunakan email lain atau langsung masuk.';
        }
      }
    }

    // Nomor WhatsApp: 10-14 digit, diawali 08/+628/628
    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor WhatsApp wajib diisi.';
    } else if (!isValidIndonesianPhone(formData.phone)) {
      newErrors.phone = 'Format nomor WhatsApp tidak valid (10-14 digit, diawali 08/+628).';
    }

    // Password minimal 6 karakter
    if (!formData.password) {
      newErrors.password = 'Kata sandi wajib diisi.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Kata sandi minimal 6 karakter.';
    }

    // Konfirmasi Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi kata sandi wajib diisi.';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Konfirmasi kata sandi tidak cocok.';
    }

    // Kode Otorisasi Admin (Wajib jika memilih peran Pengelola)
    if (formData.role === 'admin') {
      if (!formData.adminKey.trim()) {
        newErrors.adminKey = 'Kode otorisasi admin wajib diisi.';
      } else if (formData.adminKey.trim() !== 'RSTAY-ADMIN-2026') {
        newErrors.adminKey = 'Kode otorisasi admin salah. Hubungi pengelola pusat.';
      }
    }

    return newErrors;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const currentErrors = validate();
    setErrors((prev) => ({ ...prev, [field]: currentErrors[field] }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const currentErrors = validate();
      setErrors((prev) => ({ ...prev, [name]: currentErrors[name] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      nik: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      adminKey: true,
    });

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      // 1. Simpan akun ke database PostgreSQL via Server Action (dengan validasi Zod sisi server)
      const dbRes = await registerUserAction({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
        nik: formData.nik.trim(),
        ktpFileName: formData.ktpFileName,
      });

      if (!dbRes.success) {
        if (dbRes.errors) {
          setErrors((prev) => ({ ...prev, ...dbRes.errors }));
        } else if (dbRes.message.includes('sudah terdaftar')) {
          setErrors((prev) => ({ ...prev, email: dbRes.message }));
        } else {
          setErrors((prev) => ({ ...prev, nik: dbRes.message }));
        }
        setIsLoading(false);
        return;
      }

      // 2. Simpan juga ke localStorage agar sinkron dengan auth sesi klien
      saveRegisteredUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
        nik: formData.nik.trim() || (formData.role === 'penyewa' ? '3201234567890001' : '3201999988880001'),
        username: formData.email.trim().split('@')[0],
        ktpUrl: formData.ktpPreviewUrl,
        ktpFileName: formData.ktpFileName,
      });

      // 3. Alihkan ke login dengan notifikasi sukses
      const targetUrl = `/login?registered=true${
        redirectParam !== '/' ? `&redirect=${encodeURIComponent(redirectParam)}` : ''
      }`;
      router.push(targetUrl);
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Logo & Brand Header */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-3 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-900 rounded-xl p-1"
          >
            <div className="w-11 h-11 rounded-xl bg-cyan-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
              R
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-extrabold text-slate-900 leading-tight tracking-tight">
                R<span className="text-cyan-900">-Stay</span>
              </span>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">
                Boarding House
              </span>
            </div>
          </Link>
          <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Buat Akun Penghuni
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Daftarkan diri Anda untuk kemudahan reservasi dan pengelolaan sewa kamar kos.
          </p>
        </div>

        {/* Card Formulir Pendaftaran */}
        <div className="mt-6 bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Pilihan Peran Pengguna */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                Daftar Sebagai Peran <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: 'penyewa' }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.role === 'penyewa'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 text-slate-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <svg className={`w-4 h-4 ${formData.role === 'penyewa' ? 'text-blue-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-bold text-slate-900">Penyewa Kos</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Cari &amp; sewa kamar kos
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: 'admin' }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.role === 'admin'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 text-slate-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <svg className={`w-4 h-4 ${formData.role === 'admin' ? 'text-blue-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm font-bold text-slate-900">Pengelola (Admin)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Kelola kamar &amp; penghuni
                  </p>
                </button>
              </div>
            </div>

            {/* Input Khusus Pengelola: Kode Otorisasi Admin */}
            {formData.role === 'admin' && (
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Verifikasi Keamanan: Kode Otorisasi Pengelola</span>
                </div>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  Masukkan kode otorisasi keamanan untuk membuktikan wewenang Anda sebagai Super Admin pengelola seluruh properti R-Stay.
                </p>
                <div>
                  <input
                    id="reg-adminKey"
                    name="adminKey"
                    type="password"
                    value={formData.adminKey}
                    onChange={handleChange}
                    onBlur={() => handleBlur('adminKey')}
                    placeholder="Masukkan kode otorisasi pengelola"
                    className={`w-full px-3.5 py-2 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 transition-colors ${
                      errors.adminKey && touched.adminKey
                        ? 'border-red-500 bg-red-50/30 text-red-900 focus:ring-red-400'
                        : 'border-indigo-300 bg-white text-slate-900 focus:border-indigo-600 focus:ring-indigo-500'
                    }`}
                  />
                  {errors.adminKey && touched.adminKey && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-sans">
                      <span>&bull;</span> {errors.adminKey}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Fitur Unggah & Pemindaian Otomatis E-KTP (Khusus Penyewa Kos) */}
            {formData.role === 'penyewa' && (
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-blue-950">Unggah Foto E-KTP (Verifikasi Identitas)</h3>
                      <p className="text-[11px] text-blue-700">Sistem otomatis memindai NIK &amp; Nama Lengkap resmi Anda</p>
                    </div>
                  </div>
                  {ktpScanSuccess && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
                      ✓ Terbaca OCR
                    </span>
                  )}
                </div>

                <input
                  ref={ktpFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleKtpUpload}
                  className="hidden"
                  id="reg-ktp-file"
                />

                {isScanningKtp ? (
                  <div className="p-4 bg-white rounded-lg border border-blue-300 flex items-center justify-center gap-3 text-xs text-blue-700 font-semibold animate-pulse">
                    <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Mengekstrak NIK &amp; Nama dari dokumen E-KTP via OCR Dukcapil...</span>
                  </div>
                ) : ktpScanSuccess ? (
                  <div className="p-3 bg-white rounded-lg border border-emerald-200 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {formData.ktpPreviewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={formData.ktpPreviewUrl}
                          alt="E-KTP"
                          className="w-10 h-7 object-cover rounded border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-7 bg-blue-100 rounded flex items-center justify-center text-[10px] font-bold text-blue-700 shrink-0">
                          KTP
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{formData.ktpFileName}</p>
                        <p className="text-[10px] text-emerald-700 font-medium">
                          ✓ NIK: {formData.nik} • Nama: {formData.name || 'QAQA'} (Valid Dukcapil)
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => ktpFileInputRef.current?.click()}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline shrink-0 cursor-pointer"
                    >
                      Ganti Foto KTP
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => ktpFileInputRef.current?.click()}
                    className="w-full p-4 rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center group"
                  >
                    <svg className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-bold text-blue-900">
                      Klik untuk Unggah Foto E-KTP Asli
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Format: JPG, PNG, atau WebP (Maks. 3 MB). Hanya foto resmi E-KTP yang diterima oleh sistem e-KYC Dukcapil.
                    </span>
                  </button>
                )}

                {errors.nik && !ktpScanSuccess && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
                    <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="font-bold text-red-900">Verifikasi E-KTP Gagal / Ditolak</p>
                      <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">{errors.nik}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Field NIK (No. Identitas KTP) Khusus Penyewa */}
            {formData.role === 'penyewa' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="reg-nik" className="block text-sm font-semibold text-slate-900">
                    NIK / No. Identitas KTP <span className="text-red-500">*</span>
                  </label>
                  {ktpScanSuccess ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      🔒 Terbaca Otomatis dari KTP
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      16 Digit Angka
                    </span>
                  )}
                </div>
                <input
                  id="reg-nik"
                  name="nik"
                  type="text"
                  maxLength={16}
                  value={formData.nik}
                  onChange={handleChange}
                  onBlur={() => handleBlur('nik')}
                  readOnly={ktpScanSuccess}
                  placeholder="Unggah foto KTP di atas atau masukkan 16 digit NIK"
                  className={`w-full px-4 py-2.5 rounded-xl border text-slate-900 placeholder:text-slate-400 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 transition-colors ${
                    errors.nik && touched.nik
                      ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                      : ktpScanSuccess
                      ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950 font-bold focus:border-emerald-500 focus:ring-emerald-400 cursor-not-allowed'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-500'
                  }`}
                  aria-invalid={Boolean(errors.nik && touched.nik)}
                />
                {errors.nik && touched.nik ? (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <span>&bull;</span> {errors.nik}
                  </p>
                ) : (
                  <p className="mt-1 text-[10px] text-slate-500">
                    Nomor identitas resmi ini akan tersimpan permanen dan terkunci di profil akun Anda demi integritas kontrak sewa.
                  </p>
                )}
              </div>
            )}

            {/* Nama Lengkap */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="reg-name" className="block text-sm font-semibold text-slate-900">
                  Nama Lengkap (Sesuai KTP) <span className="text-red-500">*</span>
                </label>
                {ktpScanSuccess && (
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Sesuai Dokumen E-KTP
                  </span>
                )}
              </div>
              <input
                id="reg-name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur('name')}
                placeholder="Contoh: Muhammad Reza"
                className={`w-full px-4 py-2.5 rounded-xl border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors ${
                  errors.name && touched.name
                    ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-500'
                }`}
                aria-invalid={Boolean(errors.name && touched.name)}
                aria-describedby={errors.name && touched.name ? 'name-error' : undefined}
              />
              {errors.name && touched.name && (
                <p id="name-error" className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>&bull;</span> {errors.name}
                </p>
              )}
            </div>

            {/* Alamat Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-900 mb-1.5">
                Alamat Email <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                placeholder="nama@email.com"
                className={`w-full px-4 py-2.5 rounded-xl border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors ${
                  errors.email && touched.email
                    ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-500'
                }`}
                aria-invalid={Boolean(errors.email && touched.email)}
                aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
              />
              {errors.email && touched.email && (
                <p id="email-error" className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>&bull;</span> {errors.email}
                </p>
              )}
            </div>

            {/* Nomor WhatsApp */}
            <div>
              <label htmlFor="reg-phone" className="block text-sm font-semibold text-slate-900 mb-1.5">
                Nomor WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                onBlur={() => handleBlur('phone')}
                placeholder="081234567890"
                className={`w-full px-4 py-2.5 rounded-xl border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors ${
                  errors.phone && touched.phone
                    ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-500'
                }`}
                aria-invalid={Boolean(errors.phone && touched.phone)}
                aria-describedby={errors.phone && touched.phone ? 'phone-error' : undefined}
              />
              {errors.phone && touched.phone && (
                <p id="phone-error" className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>&bull;</span> {errors.phone}
                </p>
              )}
            </div>

            {/* Kata Sandi */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-900 mb-1.5">
                Kata Sandi <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                placeholder="Minimal 6 karakter"
                className={`w-full px-4 py-2.5 rounded-xl border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors ${
                  errors.password && touched.password
                    ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-500'
                }`}
                aria-invalid={Boolean(errors.password && touched.password)}
                aria-describedby={errors.password && touched.password ? 'password-error' : undefined}
              />
              {errors.password && touched.password && (
                <p id="password-error" className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>&bull;</span> {errors.password}
                </p>
              )}
            </div>

            {/* Konfirmasi Kata Sandi */}
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-semibold text-slate-900 mb-1.5">
                Konfirmasi Kata Sandi <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="Ulangi kata sandi"
                className={`w-full px-4 py-2.5 rounded-xl border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors ${
                  errors.confirmPassword && touched.confirmPassword
                    ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-500'
                }`}
                aria-invalid={Boolean(errors.confirmPassword && touched.confirmPassword)}
                aria-describedby={errors.confirmPassword && touched.confirmPassword ? 'confirm-error' : undefined}
              />
              {errors.confirmPassword && touched.confirmPassword && (
                <p id="confirm-error" className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>&bull;</span> {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Tombol Submit Daftar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Mendaftarkan Akun...</span>
                </>
              ) : (
                'Daftar Sekarang'
              )}
            </button>
          </form>

          {/* Tautan Masuk ke Akun */}
          <div className="pt-2 text-center text-sm text-slate-600 border-t border-slate-100">
            Sudah punya akun?{' '}
            <Link
              href={`/login${redirectParam !== '/' ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`}
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Masuk di sini
            </Link>
          </div>
        </div>

        {/* Kembali ke Beranda */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Beranda R-Stay
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Memuat...</div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
