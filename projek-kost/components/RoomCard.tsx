import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Badge, { BadgeVariant } from './Badge';
import { Room } from '@/types/room';

export interface RoomCardProps {
  room: Room;
}

// Mapping eksplisit dari room.type ke BadgeVariant
// Mudah di-extend, type-safe, tidak rawan silent bug akibat string manipulation
const TYPE_TO_BADGE: Record<string, BadgeVariant> = {
  'Kos Putra': 'putra',
  'Kos Putri': 'putri',
  'Kos Campur': 'campur',
};

export default function RoomCard({ room }: RoomCardProps) {
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(room.price);

  // Lookup langsung via Record — fallback 'campur' hanya jika benar-benar tidak dikenal
  const badgeVariant: BadgeVariant = TYPE_TO_BADGE[room.type] ?? 'campur';

  return (
    <article className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full focus-within:ring-2 focus-within:ring-blue-500">
      {/* Container Gambar */}
      <div className="relative w-full h-52 bg-slate-100 overflow-hidden">
        <Image
          src={room.imageUrl}
          alt={`Foto interior ${room.name} di ${room.location}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={false}
        />
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge variant={badgeVariant} />
          {/* Langsung pakai room.isAvailable tanpa alias tak perlu */}
          <Badge variant={room.isAvailable ? 'available' : 'unavailable'} />
        </div>
      </div>

      {/* Konten Kartu */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Lokasi */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
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
            <span className="truncate">{room.location}</span>
          </div>

          {/* Judul Kamar */}
          <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-500 transition-colors line-clamp-1 mb-2">
            <Link
              href={`/rooms/${room.id}`}
              className="focus:outline-none"
              aria-label={`Lihat detail ${room.name}`}
            >
              {room.name}
            </Link>
          </h2>

          {/* Fasilitas Utama (Maksimal 3 preview) */}
          <ul className="flex flex-wrap gap-1.5 mb-4" aria-label="Fasilitas utama kamar">
            {room.facilities.slice(0, 3).map((facility) => (
              // Gunakan nilai fasilitas sebagai key, bukan index — lebih stabil saat list berubah
              <li
                key={facility}
                className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium"
              >
                {facility}
              </li>
            ))}
            {room.facilities.length > 3 && (
              <li className="text-xs text-slate-600 font-medium self-center">
                +{room.facilities.length - 3} lainnya
              </li>
            )}
          </ul>
        </div>

        {/* Footer Kartu: Harga & Tombol Navigasi */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div>
            <span className="text-xs text-slate-600 block">Mulai dari</span>
            <div className="text-base font-bold text-blue-800">
              {formattedPrice}
              <span className="text-xs font-normal text-slate-600"> /bln</span>
            </div>
          </div>

          <Link
            href={`/rooms/${room.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`Detail kamar ${room.name}`}
          >
            <span>Detail</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}