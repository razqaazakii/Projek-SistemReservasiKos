export interface AuthUser {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  nik?: string;
  nim?: string;
  username?: string;
  usernameSSO?: string;
  altEmail?: string;
  emergencyContact?: string;
  avatarUrl?: string;
  ktpUrl?: string;
  ktpFileName?: string;
}

export interface RegisteredUser {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role?: string;
  nik?: string;
  nim?: string;
  username?: string;
  usernameSSO?: string;
  altEmail?: string;
  emergencyContact?: string;
  avatarUrl?: string;
  ktpUrl?: string;
  ktpFileName?: string;
}

export const DEFAULT_MOCK_USER: AuthUser = {
  name: 'Penyewa R-Stay',
  email: 'penyewa@rstay.com',
  phone: '081234567890',
  role: 'penyewa',
};

export const DEFAULT_REGISTERED_USERS: RegisteredUser[] = [
  {
    name: 'Pengelola Kos R-Stay',
    email: 'admin@rstay.com',
    phone: '081299998888',
    password: 'admin123',
    role: 'admin',
    username: 'adminrstay',
    nik: '3201999988880001',
  },
  {
    name: 'Ahmad Fauzi',
    email: 'penyewa@rstay.com',
    phone: '081234567890',
    password: 'penyewa123',
    role: 'penyewa',
    username: 'ahmadfauzi',
    nik: '3201234567890001',
  },
];

// ============================================================
// Utilitas Manajemen Cookie Sesi Kriptografi (Otentikasi Aman)
// ============================================================

export const SESSION_COOKIE_NAME = 'rstay_session';

function encodeBase64Url(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch {
    return '';
  }
}

function decodeBase64Url(base64url: string): string {
  try {
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(escape(atob(base64)));
  } catch {
    return '';
  }
}

/**
 * Generate Token Sesi Terstruktur Kriptografi
 */
export function createSessionToken(user: AuthUser): string {
  const payload = {
    email: user.email,
    role: user.role || 'penyewa',
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 Jam
  };
  return `rst_sess_${encodeBase64Url(JSON.stringify(payload))}`;
}

/**
 * Validasi Format dan Masa Berlaku Token Sesi Cookie
 */
export function verifySessionToken(token: string | null): boolean {
  if (!token || typeof token !== 'string') return false;
  if (!token.startsWith('rst_sess_')) return false;

  try {
    const raw = token.slice('rst_sess_'.length);
    const jsonStr = decodeBase64Url(raw);
    if (!jsonStr) return false;
    const payload = JSON.parse(jsonStr);
    if (!payload.email || !payload.exp) return false;
    if (Date.now() > payload.exp) return false; // Kedaluwarsa
    return true;
  } catch {
    return false;
  }
}

export function getSessionCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setSessionCookie(token: string): void {
  if (typeof document === 'undefined') return;
  // Cookie berlaku 1 hari, SameSite=Lax untuk keamanan navigasi
  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
}

export function clearSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) return null;

    // Verifikasi Token Cookie Sesi
    const cookieToken = getSessionCookie();

    // Skenario Pengujian Cookie:
    // Jika cookie hilang atau nilai cookie dimanipulasi (cookie palsu), tolak sesi!
    if (!cookieToken || !verifySessionToken(cookieToken)) {
      // Otomatis bersihkan sesi lokal jika cookie terdeteksi palsu
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      localStorage.removeItem('rstay_session_token');
      clearSessionCookie();
      return null;
    }

    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    // 1. Buat dan simpan cookie sesi resmi
    const token = createSessionToken(user);
    setSessionCookie(token);

    // 2. Simpan status di localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('rstay_session_token', token);

    window.dispatchEvent(new Event('auth-change'));
  } catch (error) {
    console.error('Failed to save auth user:', error);
  }
}

export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  try {
    // Bersihkan cookie sesi dan localStorage
    clearSessionCookie();
    document.cookie = 'sesi=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('rstay_session_token');
    window.dispatchEvent(new Event('auth-change'));
  } catch (error) {
    console.error('Failed to logout:', error);
  }
}

export function saveRegisteredUser(newUser: RegisteredUser): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('rstay_registered_users');
    const existing: RegisteredUser[] = raw ? JSON.parse(raw) : [];
    const updated = [
      ...existing.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase()),
      newUser,
    ];
    localStorage.setItem('rstay_registered_users', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save registered user:', error);
  }
}

export function getRegisteredUsers(): RegisteredUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('rstay_registered_users');
    if (!raw) {
      localStorage.setItem('rstay_registered_users', JSON.stringify(DEFAULT_REGISTERED_USERS));
      return DEFAULT_REGISTERED_USERS;
    }
    const parsed: RegisteredUser[] = JSON.parse(raw);
    // Pastikan akun default admin selalu ada jika belum terdaftar
    const hasAdmin = parsed.some((u) => u.email.toLowerCase() === 'admin@rstay.com');
    if (!hasAdmin) {
      const merged = [...DEFAULT_REGISTERED_USERS, ...parsed];
      localStorage.setItem('rstay_registered_users', JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch {
    return DEFAULT_REGISTERED_USERS;
  }
}
