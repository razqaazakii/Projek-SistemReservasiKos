"use client";

// ============================================================
// components/dashboard/KtpModal.tsx
// Modal untuk menampilkan foto KTP penyewa
// ============================================================
 
import React from "react";
import { X, CreditCard } from "lucide-react";

interface KtpModalProps {
  isOpen: boolean;
  tenantName: string;
  nik: string;
  imageUrl?: string;
  onClose: () => void;
}

export default function KtpModal({
  isOpen,
  tenantName,
  nik,
  imageUrl,
  onClose,
}: KtpModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E3A8A] flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3
                className="text-[15px] font-bold text-slate-900"
                style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}
              >
                Foto KTP
              </h3>
              <p className="text-[12px] text-slate-500">{tenantName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* NIK */}
          <div className="mb-4 flex items-center gap-2">
            <span className="text-[13px] font-semibold text-slate-500">NIK:</span>
            <code className="text-[14px] font-bold text-[#1E3A8A] bg-blue-50 px-3 py-0.5 rounded-lg tracking-widest">
              {nik}
            </code>
          </div>

          {/* Foto KTP */}
          {imageUrl ? (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`KTP ${tenantName}`}
                className="w-full object-contain max-h-72"
              />
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center py-14 text-slate-400">
              <CreditCard className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-[14px] font-semibold">Foto KTP belum diunggah</p>
              <p className="text-[12px] mt-1">
                Edit data penyewa untuk menambahkan URL foto KTP
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#1E3A8A] text-white text-[14px] font-bold hover:bg-blue-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
