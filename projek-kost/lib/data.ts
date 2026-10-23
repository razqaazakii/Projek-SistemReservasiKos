import 'server-only';
import { roomsData } from '@/data/roomsData';

/**
 * Modul data khusus server (server-only).
 * Tidak boleh diimpor atau diakses langsung oleh Client Component.
 */
export function getInternalRoomRecords() {
  return roomsData;
}
