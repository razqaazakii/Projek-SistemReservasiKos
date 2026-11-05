export interface GeoLocation {
  lat: number;
  lng: number;
}

/**
 * Menghitung jarak antara dua koordinat geografis di bumi menggunakan Formula Haversine.
 * Mengembalikan jarak dalam satuan kilometer (km).
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_KM = 6371; // Radius rata-rata bumi dalam kilometer

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Memformat angka jarak dalam kilometer menjadi teks yang mudah dibaca pengguna:
 * - Jarak di bawah 1 km ditampilkan dalam satuan meter (contoh: "450 m").
 * - Jarak 1 km ke atas ditampilkan dengan 1 desimal (contoh: "2.4 km").
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Menghasilkan URL Embed peta Google Maps (resmi dan gratis tanpa perlu API key berbayar).
 */
export function getGoogleMapsEmbedUrl(lat: number, lng: number): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&hl=id&z=15&output=embed`;
}

/**
 * Menghasilkan URL petunjuk arah navigasi Google Maps (Google Maps Directions).
 * Saat diklik di smartphone, otomatis membuka aplikasi Google Maps dan memandu rute perjalanan.
 */
export function getGoogleMapsDirectionsUrl(
  lat: number,
  lng: number,
  destinationName?: string
): string {
  const query = destinationName
    ? `${lat},${lng}+(${encodeURIComponent(destinationName)})`
    : `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}
