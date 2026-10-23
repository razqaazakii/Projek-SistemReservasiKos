// components/index.ts
// Central barrel export for all application components

// UI Primitives
export { default as Button } from './ui/Button';
export type { ButtonProps } from './ui/Button';

export { default as Badge } from './ui/Badge';
export type { BadgeProps, BadgeVariant } from './ui/Badge';

export { default as InputField } from './ui/InputField';
export type { InputFieldProps, OptionType } from './ui/InputField';

export { default as SecurityBadge } from './ui/SecurityBadge';
export type { SecurityBadgeProps } from './ui/SecurityBadge';

// Layout Components
export { default as Navbar } from './layout/Navbar';
export { default as Footer } from './layout/Footer';

// Room & Booking Components
export { default as RoomCard } from './rooms/RoomCard';
export type { RoomCardProps } from './rooms/RoomCard';

export { default as ReservationForm } from './rooms/ReservationForm';

// Dashboard Components
export { default as KtpModal } from './dashboard/KtpModal';

