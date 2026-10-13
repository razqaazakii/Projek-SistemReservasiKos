import React from 'react';

export type BadgeVariant =
  | 'putra'
  | 'putri'
  | 'campur'
  | 'available'
  | 'unavailable'
  | 'neutral';

export interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant,
  children,
  className = '',
}: BadgeProps) {
  const styles: Record<BadgeVariant, { bg: string; defaultText: string }> = {
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

  const current = styles[variant] || styles.neutral;

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
        tracking-wide transition-colors
        ${current.bg}
        ${className}
      `}
    >
      {children || current.defaultText}
    </span>
  );
}
