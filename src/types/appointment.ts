// ---------------------------------------------------------------------------
// Appointment domain types
// ---------------------------------------------------------------------------

export const APPOINTMENT_STATUS = {
  CONFIRMED: 'confirmed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
} as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  dateTime: string;
  time: string;
  status: AppointmentStatus;
  location: string;
  notes: string;
}

// NOTE: Mock data (getAppointments, addAppointment, etc.) was removed in PR 2.
// Hooks in src/hooks/useAppointments.ts now fetch from the real API via React Query.
