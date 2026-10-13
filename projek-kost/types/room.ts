export type RoomType = 'Putra' | 'Putri' | 'Campur';

export interface Room {
  id: string;
  name: string;
  price: number;
  location: string;
  type: RoomType;
  size?: string;
  facilities: string[];
  isAvailable: boolean;
  imageUrl: string;
  description: string;
  rules?: string[];
  rating?: number;
  specs?: {
    size?: string;
    bedType?: string;
    electricity?: string;
    bathroom?: string;
  };
}

export interface BookingFormData {
  roomId: string;
  fullName: string;
  email: string;
  whatsapp: string;
  checkInDate: string;
  duration: number; // 1, 3, 6, 12 Bulan
  notes?: string;
}

export interface BookingFormErrors {
  fullName?: string;
  email?: string;
  whatsapp?: string;
  checkInDate?: string;
  duration?: string;
}
