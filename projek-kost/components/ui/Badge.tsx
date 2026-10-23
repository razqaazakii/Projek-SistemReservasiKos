import React from 'react';

export type BadgeVariant =
  | 'putra'
  | 'putri'
  | 'campur'
  | 'available'
  | 'unavailable'
  | 'neutral';

// Interface eksplisit untuk struktur style badge
interface BadgeStyle {
  bg: string;
  defaultText: string;
}

// Konstanta statis di luar komponen — tidak realokasi tiap render
const BADGE_STYLES: Record<BadgeVariant, BadgeStyle> = {
  putra: {
    bg: 'bg-blue-100 text-blue-900 border border-blue-300',
    defaultText: 'Kos Putra',
  },
  putri: {
    bg: 'bg-rose-100 text-rose-900 border border-rose-300',
    defaultText: 'Kos Putri',
  },
  campur: {
    bg: 'bg-purple-100 text-purple-900 border border-purple-300',
    defaultText: 'Kos Campur',
  },
  available: {
    bg: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    defaultText: 'Tersedia',
  },
  unavailable: {
    bg: 'bg-slate-200 text-slate-800 border border-slate-300',
    defaultText: 'Penuh',
  },
  neutral: {
    bg: 'bg-slate-100 text-slate-800 border border-slate-300',
    defaultText: 'Info',
  },
};

export interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  // Tidak ada fallback ambigu — TypeScript menjamin variant selalu valid
  const { bg, defaultText } = BADGE_STYLES[variant];

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
        tracking-wide transition-colors
        ${bg}
        ${className}
      `.trim()}
    >
      {/* Nullish coalescing (??) lebih aman dari || untuk menghindari false-negative pada falsy values */}
      {children ?? defaultText}
    </span>
  );
}
