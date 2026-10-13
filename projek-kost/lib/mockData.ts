// lib/mockData.ts
// Re-export data kamar dari data/roomsData untuk kompatibilitas komponen
import { roomsData } from "@/data/roomsData";
import { Room } from "@/types/room";

export { roomsData };
export const mockData: Room[] = roomsData;
export const rooms: Room[] = roomsData;
export default roomsData;
