'use client';

import React, { useState, useMemo } from 'react';
import { roomsData } from '@/data/roomsData';
import RoomCard from '@/components/rooms/RoomCard';
import Button from '@/components/ui/Button';

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('Semua');

  const filterOptions = ['Semua', 'Putra', 'Putri', 'Campur'];

  // Filter daftar kamar berdasarkan nama/lokasi dan tipe kos
  const filteredRooms = useMemo(() => {
    return roomsData.filter((room) => {
      const matchesSearch =
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        selectedType === 'Semua' || room.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedType]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('Semua');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero / Banner Section dengan Background Murni rstay-exterior.png (Tanpa Lapisan Warna) */}
      <section
        className="relative overflow-hidden py-16 sm:py-24 md:py-32 text-center text-white bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/rstay-exterior.png')" }}
      >

        {/* Konten Teks Hero */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="max-w-3xl mx-auto">
            {/* Accent Penanda Kategori / Subtitel */}
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 backdrop-blur-md border border-black text-amber-500 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-4 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-amber-700 animate-pulse" />
              Hunian Modern • R-Stay Boarding House
            </span>

            {/* Judul Utama */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight [text-shadow:_0_2px_14px_rgba(0,0,0,0.85),_0_1px_4px_rgba(0,0,0,0.9)]">
              Temukan Hunian Kos Nyaman &amp; Strategis
            </h1>

            {/* Subtitel Penjelasan */}
            <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-white font-medium leading-relaxed [text-shadow:_0_1px_8px_rgba(0,0,0,0.85)]">
              Pilihan kamar kos terbaik dengan transparansi harga, spesifikasi lengkap, dan kemudahan proses reservasi langsung secara daring.
            </p>
          </div>
        </div>
      </section>

      {/* Konten Utama: Pencarian, Filter & Katalog Kamar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 -mt-6 sm:-mt-8 relative z-20">

        {/* Kontrol Pencarian & Filter */}
        <section
          aria-label="Filter dan Pencarian Kamar"
          className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Input Pencarian */}
            <div className="md:col-span-7 flex flex-col gap-1.5">
              <label
                htmlFor="search-input"
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
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Contoh: Yogyakarta, BSD, Setiabudi, Deluxe..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter Kategori Tipe Kos */}
            <div className="md:col-span-5 flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-900">
                Kategori Tipe Kos
              </span>
              <div
                role="radiogroup"
                aria-label="Pilih tipe kos"
                className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-lg"
              >
                {filterOptions.map((type) => {
                  const isSelected = selectedType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedType(type)}
                      className={`
                      py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors text-center
                      focus:outline-none focus:ring-2 focus:ring-blue-700
                      ${isSelected
                          ? 'bg-blue-800 text-white shadow-sm'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                        }
                    `}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Status Filter Aktif & Reset */}
          {(searchQuery || selectedType !== 'Semua') && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>
                Menampilkan filter:{' '}
                {searchQuery && (
                  <span className="font-semibold text-slate-900">
                    &quot;{searchQuery}&quot;
                  </span>
                )}
                {searchQuery && selectedType !== 'Semua' && ' • '}
                {selectedType !== 'Semua' && (
                  <span className="font-semibold text-slate-900">
                    Tipe {selectedType}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="text-blue-600 hover:text-blue-800 font-semibold underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Reset Filter
              </button>
            </div>
          )}
        </section>

        {/* Grid Katalog Kamar (1 Kolom Mobile, 2 Kolom Tablet, 3 Kolom Desktop) */}
        <section aria-labelledby="room-catalog-heading">
          <div className="flex items-center justify-between mb-6">
            <h2
              id="room-catalog-heading"
              className="text-xl sm:text-2xl font-bold text-slate-900"
            >
              Daftar Kamar Tersedia{' '}
              <span className="text-sm font-normal text-slate-500">
                ({filteredRooms.length} kamar ditemukan)
              </span>
            </h2>
          </div>

          {filteredRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Tidak Ada Kamar yang Sesuai
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Maaf, kata kunci atau kriteria filter yang Anda pilih tidak menemukan kamar kos. Coba ubah pencarian Anda.
              </p>
              <Button variant="outline" onClick={resetFilters}>
                Tampilkan Semua Kamar
              </Button>
            </div>
          )}
        </section>

        {/* Bagian Tentang & Fasilitas (#about) */}
        <section
          id="about"
          aria-labelledby="about-heading"
          className="mt-16 sm:mt-24 pt-12 border-t border-slate-200"
        >
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Keunggulan Kami
            </span>
            <h2
              id="about-heading"
              className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2"
            >
              4 Pilar Keunggulan R-Stay
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3">
              Komitmen kami menghadirkan standar hunian kos modern yang aman, nyaman, dan transparan bagi mahasiswa serta profesional muda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pilar 1: Unit Terverifikasi */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Unit Terverifikasi</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Foto riil dan spesifikasi ukuran setiap kamar telah diverifikasi langsung tanpa manipulasi visual.
              </p>
            </div>

            {/* Pilar 2: Keamanan 24 Jam */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Keamanan 24 Jam</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Akses pintu digital, pemantauan CCTV aktif 24/7, serta penjaga kos siaga untuk keamanan Anda.
              </p>
            </div>

            {/* Pilar 3: Reservasi Transparan */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Reservasi Transparan</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Biaya sewa terbuka tanpa biaya tersembunyi, deposit terjamin, dan kalkulasi diskon durasi sewa jelas.
              </p>
            </div>

            {/* Pilar 4: Fasilitas Siap Huni */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Fasilitas Siap Huni</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dilengkapi kasur springbed, lemari pakaian, meja kerja, AC dingin, dan Wi-Fi cepat siap pakai.
              </p>
            </div>
          </div>
        </section>

        {/* Bagian Kontak & FAQ (#faq) */}
        <section
          id="faq"
          aria-labelledby="faq-heading"
          className="mt-16 sm:mt-24 pt-12 border-t border-slate-200 mb-8"
        >
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              FAQ
            </span>
            <h2
              id="faq-heading"
              className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2"
            >
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3">
              Informasi lengkap seputar ketentuan hunian, fasilitas, dan tata cara sewa di R-Stay.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Bagaimana cara mengajukan reservasi kamar?
              </h3>
              <p className="text-sm text-slate-600">
                Pilih kamar yang diinginkan dari katalog, lalu klik tombol <strong>Ajukan Reservasi</strong>. Isi formulir dengan data diri dan durasi sewa, lalu ajukan permohonan Anda.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Apakah bisa melakukan survei lokasi terlebih dahulu?
              </h3>
              <p className="text-sm text-slate-600">
                Tentu saja! Anda dapat menghubungi pengelola melalui WhatsApp resmi kami untuk menjadwalkan kunjungan survei fisik di lokasi kos.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Berapa biaya deposit awal yang diperlukan?
              </h3>
              <p className="text-sm text-slate-600">
                Deposit jaminan sebesar 1 bulan sewa dan akan dikembalikan penuh di akhir masa sewa apabila tidak terdapat kerusakan fasilitas.
              </p>
            </div>

            <div className="bg-blue-50/40 p-6 rounded-xl border border-blue-100 shadow-sm">
              <h3 className="font-bold text-blue-950 text-base mb-2">
                Hubungi Tim Layanan R-Stay
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                Ada kendala atau pertanyaan spesifik? Hubungi customer care kami setiap hari kerja (08.00 - 20.00 WIB).
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
