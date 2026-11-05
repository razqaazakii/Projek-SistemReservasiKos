'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getAuthUser, logoutUser, AuthUser } from '@/lib/auth';

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Beranda', href: '/' },
  { label: 'Katalog Kamar', href: '/rooms' },
  { label: 'Tentang & Fasilitas', href: '/#about' },
  { label: 'Kontak & FAQ', href: '/#faq' },
];

function getInitials(name: string | undefined): string {
  if (!name?.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();

  // Sinkronisasi status autentikasi dari localStorage
  useEffect(() => {
    const syncUser = () => setUser(getAuthUser());
    syncUser();
    window.addEventListener('auth-change', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('auth-change', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tutup menu saat route berganti
  useEffect(() => {
    setIsOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    logoutUser();
    setIsUserMenuOpen(false);
    closeMenu();
    router.push('/');
  };

  // Navigasi responsif instan untuk hash link (#about, #faq) tanpa jeda router Next.js
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      const targetId = href.replace('/#', '');
      if (pathname === '/') {
        e.preventDefault();
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', `#${targetId}`);
        }
      }
    }
    closeMenu();
  };

  // Status link aktif
  const isLinkActive = (href: string): boolean => {
    if (href.includes('#')) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <nav
        aria-label="Main Navigation"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
      >
        {/* Brand / Logo (Sisi Kiri) */}
        <Link
          href="/"
          onClick={closeMenu}
          className="flex items-center gap-3 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-900 rounded-lg py-1 pr-2 transition-opacity hover:opacity-90"
          aria-label="R-Stay Boarding House - Beranda"
        >
          <div className="w-9 h-9 rounded-lg bg-cyan-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            R
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-900 leading-tight tracking-tight">
              R<span className="text-cyan-900">-Stay</span>
            </span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              Boarding House
            </span>
          </div>
        </Link>

        {/* Navigasi Utama Desktop (Tengah) */}
        <div className="hidden md:flex items-center h-full gap-6 lg:gap-8">
          {NAV_LINKS.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                onClick={(e) => handleNavClick(e, link.href)}
                className={[
                  'h-16 inline-flex items-center text-sm font-medium transition-colors border-b-2 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                  active
                    ? 'border-blue-600 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-blue-600 hover:border-slate-300',
                ].join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Action Button / Auth Desktop (Sisi Kanan) */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/booking"
            prefetch={true}
            className="inline-flex items-center justify-center text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-lg transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Ajukan Reservasi
          </Link>

          {!user ? (
            /* Kondisi Belum Login */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                prefetch={true}
                className="inline-flex items-center justify-center text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 border border-slate-300 px-3.5 py-2 rounded-lg transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                prefetch={true}
                className="inline-flex items-center justify-center text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 px-3.5 py-2 rounded-lg shadow-sm transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Daftar
              </Link>
            </div>
          ) : (
            /* Kondisi Sudah Login */
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-xs outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                aria-label="Menu akun pengguna"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (user.username || user.usernameSSO || user.name || 'R').charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-800 tracking-tight">
                  {user.username || user.usernameSSO || (user.email ? user.email.split('@')[0] : 'penyewa')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-slate-100 text-slate-700">
                  {user.role === 'admin' ? 'ADMIN' : 'PENYEWA'}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu Pengguna */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs text-slate-500">Masuk sebagai</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profil Saya
                    </Link>

                    {user.role === 'admin' ? (
                      <Link
                        href="/dashboard/penyewa"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50 font-medium transition-colors"
                      >
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Dashboard Pengelola
                      </Link>
                    ) : (
                      <Link
                        href="/profile#reservasi"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Reservasi Saya
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-slate-100 py-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tombol Toggle Mobile (layar <= 640px) */}
        <div className="sm:hidden flex items-center">
          <button
            type="button"
            onClick={toggleMenu}
            aria-expanded={isOpen}
            aria-controls="mobile-nav-menu"
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Menu Navigasi Mobile Drawer/Dropdown */}
      {isOpen && (
        <div
          id="mobile-nav-menu"
          className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg"
        >
          {/* Header Status Pengguna di Mobile */}
          {user ? (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">{user.name}</span>
                  <span className="text-xs text-slate-500">{user.email}</span>
                </div>
              </div>
              <Link
                href="/profile"
                onClick={closeMenu}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Profil
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1 pb-2">
              <Link
                href="/login"
                prefetch={true}
                onClick={closeMenu}
                className="w-full inline-flex items-center justify-center border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-semibold transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                prefetch={true}
                onClick={closeMenu}
                className="w-full inline-flex items-center justify-center bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Daftar
              </Link>
            </div>
          )}

          <div className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={[
                    'px-3.5 py-2.5 rounded-lg text-sm transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                    active
                      ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 pl-2.5'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-medium',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/booking"
              prefetch={true}
              onClick={closeMenu}
              className="w-full inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Ajukan Reservasi
            </Link>

            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full inline-flex items-center justify-center border border-red-200 text-red-600 hover:bg-red-50 font-medium px-4 py-2 rounded-lg transition-colors text-sm outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Keluar dari Akun
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
