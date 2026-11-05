import { cookies } from 'next/headers';

// Server-side In-Memory Map Session Storage
// Menggunakan globalThis agar map sesi tidak ter-reset saat hot module reloading (HMR) di mode dev
const globalForSession = globalThis as unknown as {
  serverSessionMap: Map<string, { id: string; email: string; role: string; createdAt: number }>;
};

export const serverSessionMap =
  globalForSession.serverSessionMap ||  
  new Map<string, { id: string; email: string; role: string; createdAt: number }>();

if (process.env.NODE_ENV !== 'production') {
  globalForSession.serverSessionMap = serverSessionMap;
}

export const SESSION_COOKIE_NAME = 'sesi';

export async function simpanSesi(email: string, role: string = 'admin'): Promise<string> {
  const sessionId = crypto.randomUUID();
  serverSessionMap.set(sessionId, {
    id: sessionId,
    email,
    role,
    createdAt: Date.now(),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    path: '/',
    httpOnly: false, // Diperbolehkan dibaca/diubah di DevTools untuk skenario pengujian
    sameSite: 'lax',
    maxAge: 86400, // 24 Jam
  });

  return sessionId;
}

/**
 * Membaca dan memvalidasi sesi dari cookie 'sesi' terhadap Server Storage (Map)
 * Jika cookie tidak ada ATAU UUID tidak ada di server memory, mengembalikan null
 */
export async function bacaSesi(): Promise<{ id: string; email: string; role: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionToken = sessionCookie.value.trim();
  const sessionData = serverSessionMap.get(sessionToken);

  if (!sessionData) {
    // Cookie palsu atau sesi sudah dicabut
    return null;
  }

  return sessionData;
}

/**
 * Mencabut sesi dari Server Storage (Map) dan menghapus cookie dari peramban
 */
export async function hapusSesi(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (sessionCookie && sessionCookie.value) {
    serverSessionMap.delete(sessionCookie.value.trim());
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
