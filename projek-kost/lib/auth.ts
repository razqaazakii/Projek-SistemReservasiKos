export interface AuthUser {
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export const DEFAULT_MOCK_USER: AuthUser = {
  name: 'Penyewa R-Stay',
  email: 'penyewa@rstay.com',
  phone: '081234567890',
  role: 'penyewa',
};

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) return null;
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('auth-change'));
  } catch (error) {
    console.error('Failed to save auth user:', error);
  }
}

export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
  } catch (error) {
    console.error('Failed to logout:', error);
  }
}

export function saveRegisteredUser(newUser: {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('rstay_registered_users');
    const existing: Array<{ name: string; email: string; phone?: string; password?: string }> =
      raw ? JSON.parse(raw) : [];
    const updated = [
      ...existing.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase()),
      newUser,
    ];
    localStorage.setItem('rstay_registered_users', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save registered user:', error);
  }
}

export function getRegisteredUsers(): Array<{
  name: string;
  email: string;
  phone?: string;
  password?: string;
}> {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('rstay_registered_users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
