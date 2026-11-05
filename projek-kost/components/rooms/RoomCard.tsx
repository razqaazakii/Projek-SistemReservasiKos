import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Badge, { BadgeVariant } from '@/components/ui/Badge';
import { Room } from '@/types/room';

export interface RoomCardProps {
  room: Room;
}

// Mapping eksplisit dari room.type ke BadgeVariant
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

        {/* Harga & Tombol Aksi */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
              Mulai dari
            </span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-base font-bold text-slate-900">
                {formattedPrice}
              </span>
              <span className="text-xs text-slate-600">/bln</span>
            </div>
          </div>

          <Link
            href={`/rooms/${room.id}`}
            className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Lihat detail lengkap kamar ${room.name}`}
          >
            Lihat Detail
          </Link>
        </div>
      </div>
    </article>
  );
}
