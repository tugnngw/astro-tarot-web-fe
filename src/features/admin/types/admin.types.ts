export interface PendingReaderApplication {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  bio: string;
  experience: number;
  specialties: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export interface ReviewReaderRequest {
  action: "APPROVED" | "REJECTED";
  rejectionReason?: string;
}
