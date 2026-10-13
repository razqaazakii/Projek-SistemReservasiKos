'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAuthUser, DEFAULT_MOCK_USER, getRegisteredUsers } from '@/lib/auth';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/';
  const isRegisteredSuccess = searchParams.get('registered') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Alamat email wajib diisi.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Format email tidak valid (contoh: user@domain.com).';
      }
    }

    if (!password) {
      newErrors.password = 'Kata sandi wajib diisi.';
    } else if (password.length < 6) {
      newErrors.password = 'Kata sandi minimal 6 karakter.';
    }

    return newErrors;
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const currentErrors = validate();
    setErrors((prev) => ({ ...prev, [field]: currentErrors[field] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    // Cari apakah ada data akun di registered users
    const registered = getRegisteredUsers();
    const matchedUser = registered.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

    const userName = matchedUser
      ? matchedUser.name
      : email.toLowerCase().includes('penyewa')
      ? 'Penyewa R-Stay'
      : email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const userPhone = matchedUser?.phone || '081234567890';

    setTimeout(() => {
      setAuthUser({
        name: userName,
        email: email.trim(),
        phone: userPhone,
        role: 'penyewa',
      });

      setIsLoading(false);
      router.push(redirectParam);
    }, 400);
  };

  const handleFillMockAccount = () => {
    setEmail(DEFAULT_MOCK_USER.email);
    setPassword('password123');
    setErrors({});
    setTouched({ email: true, password: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Logo & Brand Header */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-cyan-900 rounded-xl p-1"
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
            Masuk ke Akun Anda
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Akses pemesanan kamar kos, kelola status sewa, dan pengajuan reservasi.
          </p>
        </div>

        {/* Notifikasi Pendaftaran Berhasil jika redirect dari /register */}
        {isRegisteredSuccess && (
          <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">Pendaftaran Akun Berhasil!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Akun Anda telah tersimpan. Silakan masuk dengan kredensial yang baru saja Anda daftarkan.
              </p>
            </div>
          </div>
        )}

        {/* Notifikasi Redirect karena butuh reservasi */}
        {redirectParam.includes('/booking') && !isRegisteredSuccess && (
          <div className="mt-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-start gap-2.5">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              Silakan <strong>masuk terlebih dahulu</strong> untuk melanjutkan proses pengajuan reservasi kamar.
            </span>
          </div>
        )}

        {/* Form Card */}
        <div className="mt-6 bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Input Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-slate-900 mb-1.5">
                Alamat Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="penyewa@rstay.com"
                  className={`w-full px-4 py-2.5 rounded-xl border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors ${
                    errors.email && touched.email
                      ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-500'
                  }`}
                  aria-invalid={Boolean(errors.email && touched.email)}
                  aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && touched.email && (
                <p id="email-error" className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>&bull;</span> {errors.email}
                </p>
              )}
            </div>

            {/* Input Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-semibold text-slate-900">
                  Kata Sandi <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              </div>
              {errors.password && touched.password && (
                <p id="password-error" className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>&bull;</span> {errors.password}
                </p>
              )}
            </div>

            {/* Tombol Submit Masuk */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                'Masuk ke Akun'
              )}
            </button>
          </form>

          {/* Tautan Daftar Baru */}
          <div className="pt-2 text-center text-sm text-slate-600 border-t border-slate-100">
            Belum punya akun?{' '}
            <Link
              href={`/register${redirectParam !== '/' ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`}
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Daftar sekarang
            </Link>
          </div>

          {/* Bantuan Penguji (Demo / Testing Box) */}
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Akun Uji Coba Penguji
              </span>
              <button
                type="button"
                onClick={handleFillMockAccount}
                className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-50 transition-colors shadow-2xs"
              >
                Gunakan Akun Ini
              </button>
            </div>
            <div className="text-slate-600 leading-relaxed font-mono text-[11px]">
              <div>Email : <span className="text-slate-900 font-semibold">{DEFAULT_MOCK_USER.email}</span></div>
              <div>Sandi : <span className="text-slate-900 font-semibold">password123</span></div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              *Sistem Mock Auth menyimpan sesi langsung di browser (localStorage) tanpa backend database.
            </p>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Memuat...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}