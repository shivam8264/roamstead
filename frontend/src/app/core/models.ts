/** Mirrors the DTOs returned by the Roamstead API. Dates are ISO strings (YYYY-MM-DD). */

export interface HotelSummary {
  id: number;
  name: string;
  city: string;
  region: string;
  tagline: string;
  starRating: number;
  coverImage: string;
  amenities: string[];
  roomTypeName: string;
  pricePerNight: number;
  totalRooms: number;
  availableRooms: number | null;
  nights: number | null;
  stayTotal: number | null;
}

export interface Room {
  id: number;
  name: string;
  description: string;
  maxGuests: number;
  bedType: string;
  sizeSqm: number;
  pricePerNight: number;
  totalRooms: number;
  availableRooms: number | null;
}

export interface HotelDetail {
  id: number;
  name: string;
  city: string;
  region: string;
  address: string;
  tagline: string;
  description: string;
  starRating: number;
  coverImage: string;
  images: string[];
  amenities: string[];
  rooms: Room[];
  checkIn: string | null;
  checkOut: string | null;
  nights: number | null;
}

export interface Quote {
  hotelId: number;
  hotelName: string;
  roomTypeId: number;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  pricePerNight: number;
  totalAmount: number;
  availableRooms: number;
  available: boolean;
}

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface Booking {
  reference: string;
  status: BookingStatus;
  hotelId: number;
  hotelName: string;
  hotelCity: string;
  hotelAddress: string;
  coverImage: string;
  roomTypeName: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  pricePerNight: number;
  totalAmount: number;
  createdAt: string;
  cancelledAt: string | null;
  cancellable: boolean;
}

export interface CreateBookingRequest {
  hotelId: number;
  roomTypeId?: number;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
}

export interface NightAvailability {
  date: string;
  availableRooms: number;
  totalRooms: number;
}

export interface AvailabilityCalendar {
  hotelId: number;
  roomTypeId: number;
  pricePerNight: number;
  nights: NightAvailability[];
}

export interface FlexOption {
  checkIn: string;
  checkOut: string;
  offsetDays: number;
  availableRooms: number;
  totalAmount: number;
}

export interface FlexDates {
  hotelId: number;
  requestedCheckIn: string;
  requestedCheckOut: string;
  nights: number;
  requestedAvailable: boolean;
  requestedAvailableRooms: number;
  options: FlexOption[];
}

/** The single error shape every endpoint returns. */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  fieldErrors?: { field: string; message: string }[];
}
