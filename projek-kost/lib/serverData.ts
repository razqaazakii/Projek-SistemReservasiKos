import 'server-only';
import { roomsData } from '@/data/roomsData';

export function getInternalRoomRecords() {
  return roomsData;
}
