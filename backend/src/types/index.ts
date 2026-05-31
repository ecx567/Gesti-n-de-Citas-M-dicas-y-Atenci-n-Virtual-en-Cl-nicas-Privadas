// ---------------------------------------------------------------------------
// Shared API types — mirrors frontend types where applicable
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  specialty?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
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

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
}

export interface DoctorInfo {
  id: string;
  name: string;
  specialty: string;
}

// Express extension for auth middleware
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
