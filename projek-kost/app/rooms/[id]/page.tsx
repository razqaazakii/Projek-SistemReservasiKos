import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { roomsData } from '@/data/roomsData';
import { Room } from '@/types/room';
import Badge from '@/components/Badge';

interface RoomDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateStaticParams() {
  return roomsData.map((room: Room) => ({
    id: room.id,
  }));
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { id } = await params;
  const room = roomsData.find((r: Room) => r.id === id);

  if (!room) {
    notFound();
  }

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(room.price);

  const badgeVariant =
    room.type === 'Putra' ? 'putra' : room.type === 'Putri' ? 'putri' : 'campur';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb & Navigasi Kembali */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-slate-600">
        <Link
          href="/"
          className="hover:text-blue-600 underline font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          Katalog Kos
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
          {room.name}
        </span>
      </nav>

      {/* Grid Utama: Kolom Kiri Informasi, Kolom Kanan CTA Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Galeri Foto & Konten Detail */}
        <article className="lg:col-span-8 flex flex-col gap-8">
          {/* Header Kamar */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant={badgeVariant} />
              <Badge variant={room.isAvailable ? 'available' : 'unavailable'} />
              {room.rating && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  ★ {room.rating.toFixed(1)} / 5.0
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
              {room.name}
            </h1>

            <p className="mt-2 text-sm sm:text-base text-slate-600 flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-slate-500 shrink-0"
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{room.location}</span>
            </p>
          </div>

          {/* Galeri Gambar */}
          <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
            <Image
              src={room.imageUrl}
              alt={`Tampilan kamar ${room.name} di ${room.location}`}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 800px"
            />
          </div>

          {/* Deskripsi Kamar */}
          <section
            aria-labelledby="section-deskripsi"
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
          >
            <h2 id="section-deskripsi" className="text-xl font-bold text-slate-900 mb-3">
              Deskripsi Hunian
            </h2>
            <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {room.description}
            </p>
          </section>

          {/* Spesifikasi Ruangan */}
          {room.specs && (
            <section
              aria-labelledby="section-spesifikasi"
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
            >
              <h2 id="section-spesifikasi" className="text-xl font-bold text-slate-900 mb-4">
                Spesifikasi Ruangan
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {room.specs.size && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-900 text-sm">Ukuran Kamar:</span>
                    <span className="text-sm text-slate-700">{room.specs.size}</span>
                  </div>
                )}
                {room.specs.bedType && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-900 text-sm">Tipe Kasur:</span>
                    <span className="text-sm text-slate-700">{room.specs.bedType}</span>
                  </div>
                )}
                {room.specs.electricity && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-900 text-sm">Listrik:</span>
                    <span className="text-sm text-slate-700">{room.specs.electricity}</span>
                  </div>
                )}
                {room.specs.bathroom && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-900 text-sm">Kamar Mandi:</span>
                    <span className="text-sm text-slate-700">{room.specs.bathroom}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Fasilitas Kamar */}
          <section
            aria-labelledby="section-fasilitas"
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
          >
            <h2 id="section-fasilitas" className="text-xl font-bold text-slate-900 mb-4">
              Fasilitas Lengkap
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="Daftar fasilitas">
              {room.facilities.map((facility, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2.5 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg"
                >
                  <svg
                    className="w-5 h-5 text-emerald-600 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{facility}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Aturan & Tata Tertib Kos */}
          {room.rules && room.rules.length > 0 && (
            <section
              aria-labelledby="section-aturan"
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
            >
              <h2 id="section-aturan" className="text-xl font-bold text-slate-900 mb-3">
                Peraturan & Tata Tertib Kos
              </h2>
              <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
                {room.rules.map((rule, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {rule}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        {/* Kolom Kanan: Sticky Booking Card & CTA */}
        <aside className="lg:col-span-4 sticky top-24">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md">
            <div className="mb-4 pb-4 border-b border-slate-100">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Biaya Sewa
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">
                  {formattedPrice}
                </span>
                <span className="text-sm font-medium text-slate-600">/ bulan</span>
              </div>
            </div>

            <div className="space-y-3 mb-6 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Status Ketersediaan:</span>
                <span className={`font-semibold ${room.isAvailable ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {room.isAvailable ? 'Siap Dihuni' : 'Kamar Penuh'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Minimal Kontrak:</span>
                <span className="font-semibold text-slate-900">1 Bulan</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Biaya Admin:</span>
                <span className="font-semibold text-emerald-700">Gratis (Rp 0)</span>
              </div>
            </div>

            {room.isAvailable ? (
              <Link
                href={`/booking?roomId=${room.id}`}
                className="w-full inline-flex items-center justify-center px-6 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={`Ajukan reservasi untuk kamar ${room.name}`}
              >
                Ajukan Reservasi Sekarang
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="w-full px-6 py-3.5 text-base font-bold text-slate-500 bg-slate-200 rounded-xl cursor-not-allowed text-center"
              >
                Kamar Saat Ini Penuh
              </button>
            )}

            <div className="mt-4 text-center">
              <Link
                href="/"
                className="text-xs font-semibold text-slate-600 hover:text-blue-600 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                ← Kembali ke Katalog Kamar
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
