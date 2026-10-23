import React from 'react';

// 'disabled' tidak dideklarasikan ulang karena sudah diwarisi dari ButtonHTMLAttributes
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  fullWidth?: boolean;
}

// Konstanta statis yang diangkat ke module-level agar tidak realokasi tiap render
const BASE_STYLES =
  'inline-flex items-center justify-center font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer';

const SIZE_STYLES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
};

const VARIANT_STYLES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 shadow-sm',
  secondary:
    'bg-slate-800 text-white hover:bg-slate-900 active:bg-black focus:ring-slate-700 shadow-sm',
  outline:
    'border-2 border-slate-300 text-slate-800 bg-white hover:bg-slate-100 active:bg-slate-200 focus:ring-blue-500',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 shadow-sm',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  type = 'button',
  fullWidth = false,
  ...props
}: ButtonProps) {
  // Membuat class string dengan filter agar tidak ada whitespace berlebih
  const classes = [
    BASE_STYLES,
    SIZE_STYLES[size],
    VARIANT_STYLES[variant],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
