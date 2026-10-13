'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthUser, logoutUser, AuthUser } from '@/lib/auth';

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const currentUser = getAuthUser();
    if (!currentUser) {
      router.push('/login?redirect=/profile');
    } else {
      setUser(currentUser);
    }
  }, [router]);

  const handleLogout = () => {
    logoutUser();
    router.push('/');
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

  return (
    <div className="min-h-screen bg-slate-50 py-10 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Tombol Kembali */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Beranda
        </Link>

        {/* Kartu Profil Utama */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-400 via-indigo-600 to-blue-600 relative " />

          {/* Avatar & Identitas */}
          <div className="px-6 sm:px-8 pb-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-14 sm:-mt-16 gap-4 mb-6">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-md">
                  <div className="w-full h-full rounded-xl bg-blue-400 text-white font-extrabold text-2xl flex items-center justify-center shadow-inner">
                    {getInitials(user.name)}
                  </div>
                </div>
                <div className="mb-1">
                  <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
                    {user.name}
                  </h1>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mt-1">
                    Akun Penghuni Terverifikasi
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/booking"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
                >
                  Ajukan Reservasi
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-sm font-semibold transition-colors"
                >
                  Keluar
                </button>
              </div>
            </div>

            {/* Informasi Detail Akun */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Alamat Email
                </p>
                <p className="text-sm font-semibold text-slate-900 break-all">
                  {user.email}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Nomor WhatsApp
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {user.phone || '081234567890'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Status Keanggotaan
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  Member R-Stay Privilege
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Metode Autentikasi
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  Sesi Client-Side (localStorage)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
