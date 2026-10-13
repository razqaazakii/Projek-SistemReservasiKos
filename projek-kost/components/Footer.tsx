import React from 'react';
import Link from 'next/link';
import { Mail, Phone, Clock, MapPin } from 'lucide-react';

// Tipe eksplisit untuk setiap entri navigasi
interface NavItem {
  label: string;
  href: string;
  highlight?: boolean;
}

// Tipe eksplisit untuk kontak
interface ContactItem {
  label: string;
  subLabel: string;
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

// Data navigasi diangkat ke module-level — tidak hardcode di JSX
const NAV_ITEMS: NavItem[] = [
  { label: 'Beranda', href: '/' },
  { label: 'Katalog Kamar', href: '/rooms' },
  { label: 'Tentang & Fasilitas', href: '/#about' },
  { label: 'Pertanyaan Umum (FAQ)', href: '/#faq' },
  { label: 'Ajukan Reservasi →', href: '/booking', highlight: true },
];

export default function Footer() {
  // Data kontak di-define di dalam komponen agar bisa menerima JSX icon
  const CONTACT_ITEMS: ContactItem[] = [
    {
      label: 'WhatsApp CS',
      subLabel: '0813-6449-9302',
      href: 'https://wa.me/6281364680843',
      icon: <Phone className="w-4 h-4" />,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Email Resmi',
      subLabel: 'r-stay@gmail.com',
      href: 'mailto:r-stay@gmail.com',
      icon: <Mail className="w-4 h-4" />,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
  ];

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand & Profil */}
          <div className="space-y-4 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-900 rounded-lg"
              aria-label="R-Stay Boarding House"
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
            <p className="text-sm text-slate-600 leading-relaxed">
              Platform reservasi hunian kos modern dengan transparansi fasilitas, keamanan terjamin, dan proses sewa cepat tanpa repot.
            </p>
          </div>

          {/* Navigasi Cepat */}
          <div>
            <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-4">
              Navigasi
            </h3>
            {/* Render dari data — tidak hardcode setiap <li> */}
            <ul className="space-y-2.5 text-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      item.highlight
                        ? 'text-blue-600 font-semibold hover:text-blue-700 transition-colors'
                        : 'text-slate-600 hover:text-blue-600 transition-colors'
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak & Layanan Penghuni */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-4">
              Layanan & Kontak Pengelola
            </h3>
            <p className="text-sm text-slate-600">
              Butuh bantuan atau informasi mengenai ketersediaan kamar? Hubungi layanan pelanggan kami:
            </p>

            {/* Render dari data kontak */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {CONTACT_ITEMS.map((contact) => (
                <a
                  key={contact.href}
                  href={contact.href}
                  target={contact.href.startsWith('http') ? '_blank' : undefined}
                  rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors group"
                >
                  <div
                    className={`w-9 h-9 rounded-lg ${contact.iconBg} ${contact.iconColor} flex items-center justify-center shrink-0`}
                  >
                    {contact.icon}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs text-slate-500 font-medium">{contact.label}</span>
                    <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                      {contact.subLabel}
                    </span>
                  </div>
                </a>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Layanan CS: 08.00 - 20.00 WIB
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Indonesia
              </span>
            </div>
          </div>
        </div>

        {/* Garis batas & Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; 2026 R-Stay. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}