// src/api/appointments/types.ts

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AppointmentApi {
  id: string;
  doctor: {
    id: string;
    name: string;
    specialty: string;
  };
  patientId: string;
  dateTime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  location: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentPayload {
  doctorId: string;
  dateTime: string;
  location: string;
  notes?: string;
}
