'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveRegisteredUser } from '@/lib/auth';

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Nama Lengkap minimal 3 karakter
    if (!formData.name.trim()) {
      newErrors.name = 'Nama lengkap wajib diisi.';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nama lengkap minimal 3 karakter.';
    }

    // Email valid
    if (!formData.email.trim()) {
      newErrors.email = 'Alamat email wajib diisi.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Format alamat email tidak valid.';
      }
    }

    // Nomor WhatsApp
    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor WhatsApp wajib diisi.';
    } else {
      const cleanPhone = formData.phone.replace(/[\s-]/g, '');
      const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,10}$/;
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = 'Format nomor WhatsApp tidak valid (10-13 digit, contoh: 081234567890).';
      }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Simpan akun baru ke localStorage
      saveRegisteredUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      setIsLoading(false);
      // Alihkan ke login dengan notifikasi sukses
      const targetUrl = `/login?registered=true${
        redirectParam !== '/' ? `&redirect=${encodeURIComponent(redirectParam)}` : ''
      }`;
      router.push(targetUrl);
    }, 500);
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
            Buat Akun Penghuni
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Daftarkan diri Anda untuk kemudahan reservasi dan pengelolaan sewa kamar kos.
          </p>
        </div>

        {/* Card Formulir Pendaftaran */}
        <div className="mt-6 bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Nama Lengkap */}
            <div>
              <label htmlFor="reg-name" className="block text-sm font-semibold text-slate-900 mb-1.5">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur('name')}
                placeholder="Contoh: John Doe"
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
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 flex items-center justify-center gap-2"
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
