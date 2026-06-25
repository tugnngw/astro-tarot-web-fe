// src/features/readers/types/reader.types.ts
export interface Reader {
  id: string;
  userId: string;
  displayName: string;
  specialties: string[];
  experience: number; // years
  rating: number;
  totalReadings: number;
  status: "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED";
  bio: string;
  pricePerReading: number;
  languages: string[];
  avatar?: string;
  availability: Availability[];
  certifications?: string[];
  reviews?: Review[];
  createdAt: string;
  updatedAt: string;
}

export interface Availability {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  readerId: string;
  userId: string;
  service: string;
  dateTime: string;
  duration: number; // minutes
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  price: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  reader?: Reader;
}

export interface BookingRequest {
  readerId: string;
  service: string;
  dateTime: string;
  duration: number;
  notes?: string;
}

export interface BecomeReaderRequest {
  specialties: string[];
  bio: string;
  pricePerReading: number;
  languages: string[];
  certifications?: string[];
}

export interface ReaderStats {
  totalReadings: number;
  totalEarnings: number;
  averageRating: number;
  completionRate: number;
  upcomingBookings: number;
  monthlyReadings: {
    month: string;
    count: number;
  }[];
  topSpecialties: {
    specialty: string;
    count: number;
  }[];
}

export interface ReaderFilter {
  specialties?: string[];
  minRating?: number;
  maxPrice?: number;
  languages?: string[];
  status?: "ACTIVE" | "PENDING";
  availability?: boolean;
}
