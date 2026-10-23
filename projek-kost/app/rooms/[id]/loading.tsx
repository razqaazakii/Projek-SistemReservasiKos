import React from 'react';

export default function RoomDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 w-20 bg-slate-200 rounded" />
        <span className="text-slate-300">/</span>
        <div className="h-4 w-36 bg-slate-200 rounded" />
      </div>

      {/* Grid Utama Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Galeri & Info Kamar */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Header & Badges */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-16 bg-slate-200 rounded-full" />
              <div className="h-6 w-24 bg-slate-200 rounded-full" />
            </div>
            <div className="h-9 w-3/4 bg-slate-200 rounded-lg mb-2" />
            <div className="h-5 w-1/2 bg-slate-200 rounded" />
          </div>

          {/* Banner Gambar Skeleton */}
          <div className="w-full h-72 sm:h-96 bg-slate-200 rounded-2xl" />

          {/* Fasilitas Skeleton */}
          <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="h-6 w-40 bg-slate-200 rounded mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Deskripsi Skeleton */}
          <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
            <div className="h-6 w-48 bg-slate-200 rounded mb-2" />
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-5/6 bg-slate-200 rounded" />
            <div className="h-4 w-4/6 bg-slate-200 rounded" />
          </div>
        </div>

        {/* Kolom Kanan: Card Booking CTA Skeleton */}
        <aside className="lg:col-span-4">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-8 w-44 bg-slate-200 rounded" />
            <div className="h-10 bg-slate-200 rounded-xl mt-4" />
            <div className="h-4 w-full bg-slate-100 rounded mt-2" />
          </div>
        </aside>
      </div>
    </div>
  );
}
