'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { roomsData } from '@/data/roomsData';
import { Room } from '@/types/room';
import RoomCard from '@/components/rooms/RoomCard';
import Button from '@/components/ui/Button'; 
import { getRoomsAction } from '@/actions/room';

export default function RoomsCatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('Semua');

  // State Kamar Kos Terintegrasi Basis Data PostgreSQL
  const [rooms, setRooms] = useState<Room[]>(roomsData);
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(true);

  // Ambil data kamar persisten dari database PostgreSQL
  useEffect(() => {
    let isMounted = true;
    getRoomsAction()
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data)) {
          setRooms(res.data);
          setIsLoadingRooms(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingRooms(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filterOptions = ['Semua', 'Putra', 'Putri', 'Campur'];

  // Filter daftar kamar berdasarkan kata kunci (nama & lokasi) serta kategori tipe sewa
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch =
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        selectedType === 'Semua' ||
        room.type.toLowerCase() === selectedType.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedType, rooms]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('Semua');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigasi */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-slate-600">
          <Link
            href="/"
            className="hover:text-blue-600 underline font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            Beranda
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 font-semibold">Katalog Kamar</span>
        </nav>

        {/* Header Halaman Katalog */}
        <div className="mb-8">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mb-2">
            Pilihan Kamar Terverifikasi
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Katalog Kamar Kos R-Stay   
          </h1>
          <p className="mt-2 text-base text-slate-600 max-w-2xl">
            Jelajahi berbagai pilihan kamar kos putra, putri, dan campur dengan fasilitas lengkap dan transparansi harga.
          </p>
        </div>

        {/* Kontrol Pencarian & Filter */}
        <section
          aria-label="Filter dan Pencarian Kamar"
          className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Input Pencarian */}
            <div className="md:col-span-7 flex flex-col gap-1.5">
              <label
                htmlFor="search-rooms-input"
                className="text-sm font-semibold text-slate-900"
              >
                Cari Nama atau Lokasi Kos
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <input
                  id="search-rooms-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Contoh: Griya Asri, Sleman, UGM, Dago, BSD..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Filter Tipe Kos */}
            <div className="md:col-span-5 flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-900">
                Tipe Kamar Kos
              </span>
              <div
                role="group"
                aria-label="Pilihan Tipe Kos"
                className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200"
              >
                {filterOptions.map((type) => {
                  const isActive = selectedType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`flex-1 min-w-17.5 py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer ${isActive
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Ringkasan Hasil Pencarian */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-medium text-slate-600 flex items-center">
            <span>Menampilkan <strong className="font-bold text-slate-900">{filteredRooms.length}</strong> dari {rooms.length} kamar</span>
            {isLoadingRooms && (
              <span className="text-xs text-blue-600 animate-pulse font-medium ml-2">
                (Memperbarui data...)
              </span>
            )}
          </p>
          {(searchQuery || selectedType !== 'Semua') && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              Reset Semua Filter
            </button>
          )}
        </div>

        {/* Grid Katalog Kamar */}
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Kamar Tidak Ditemukan
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Tidak ada kamar yang sesuai dengan kriteria pencarian &quot;{searchQuery}&quot; atau tipe &quot;{selectedType}&quot;.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-xl hover:bg-blue-50 transition font-medium text-sm"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
