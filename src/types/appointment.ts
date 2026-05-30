// ---------------------------------------------------------------------------
// Appointment domain types
// ---------------------------------------------------------------------------

export const APPOINTMENT_STATUS = {
  CONFIRMED: 'confirmed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
} as const;

export type AppointmentStatus =
  (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

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

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    doctorName: 'Dra. María García',
    specialty: 'Medicina General',
    date: 'Lunes, 2 de junio',
    dateTime: '2026-06-02T10:30:00',
    time: '10:30 AM',
    status: 'confirmed',
    location: 'Consultorio 204, Piso 2',
    notes: 'Traer resultados de análisis de sangre recientes.',
  },
  {
    id: '2',
    doctorName: 'Dr. Carlos López',
    specialty: 'Cardiología',
    date: 'Jueves, 5 de junio',
    dateTime: '2026-06-05T14:00:00',
    time: '2:00 PM',
    status: 'pending',
    location: 'Consultorio 310, Piso 3',
    notes: 'Paciente nuevo — traer historial médico completo.',
  },
  {
    id: '3',
    doctorName: 'Dr. Juan Pérez',
    specialty: 'Medicina General',
    date: 'Miércoles, 28 de mayo',
    dateTime: '2026-05-28T09:00:00',
    time: '9:00 AM',
    status: 'confirmed',
    location: 'Consultorio 201, Piso 2',
    notes: 'Control de rutina. Presión arterial estable.',
  },
  {
    id: '4',
    doctorName: 'Dra. Ana Martínez',
    specialty: 'Cardiología',
    date: 'Viernes, 23 de mayo',
    dateTime: '2026-05-23T11:00:00',
    time: '11:00 AM',
    status: 'cancelled',
    location: 'Consultorio 305, Piso 3',
    notes: 'Cancelada por el paciente. Reprogramar para junio.',
  },
  {
    id: '5',
    doctorName: 'Dra. Laura Sánchez',
    specialty: 'Pediatría',
    date: 'Sábado, 7 de junio',
    dateTime: '2026-06-07T08:30:00',
    time: '8:30 AM',
    status: 'confirmed',
    location: 'Consultorio 110, Piso 1',
    notes: 'Vacunación programada. Traer cartilla de vacunación.',
  },
  {
    id: '6',
    doctorName: 'Dr. Pedro Ramírez',
    specialty: 'Pediatría',
    date: 'Martes, 27 de mayo',
    dateTime: '2026-05-27T16:00:00',
    time: '4:00 PM',
    status: 'confirmed',
    location: 'Consultorio 115, Piso 1',
    notes: 'Consulta de seguimiento. Desarrollo normal.',
  },
];

let appointments = [...MOCK_APPOINTMENTS];

export function getAppointments(): Appointment[] {
  return [...appointments];
}

export function getAppointmentById(id: string): Appointment | undefined {
  return appointments.find((a) => a.id === id);
}

export function addAppointment(appointment: Appointment): void {
  appointments.push(appointment);
}

// Reset for testing
export function resetAppointments(): void {
  appointments = [...MOCK_APPOINTMENTS];
}
