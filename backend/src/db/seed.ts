import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import db from './index.js';

// ---------------------------------------------------------------------------
// Seed data — run via: tsx src/db/seed.ts
// ---------------------------------------------------------------------------

const now = new Date().toISOString();
const hashed = bcrypt.hashSync('Test123!', 10);

// Test patient
const patientId = uuid();

const patient = {
  id: patientId,
  name: 'Erick Correa',
  email: 'test@vitacitas.com',
  password: hashed,
  role: 'patient',
  specialty: null,
  phone: '+593 99 999 9999',
  createdAt: now,
  updatedAt: now,
};

// Doctors
const doctors = [
  { name: 'Dra. María García', email: 'maria@vitacitas.com', specialty: 'Medicina General' },
  { name: 'Dr. Juan Pérez', email: 'juan@vitacitas.com', specialty: 'Medicina General' },
  { name: 'Dr. Carlos López', email: 'carlos@vitacitas.com', specialty: 'Cardiología' },
  { name: 'Dra. Ana Martínez', email: 'ana@vitacitas.com', specialty: 'Cardiología' },
  { name: 'Dra. Laura Sánchez', email: 'laura@vitacitas.com', specialty: 'Pediatría' },
  { name: 'Dr. Pedro Ramírez', email: 'pedro@vitacitas.com', specialty: 'Pediatría' },
  { name: 'Dra. Carmen Torres', email: 'carmen@vitacitas.com', specialty: 'Dermatología' },
  { name: 'Dr. Andrés Vega', email: 'andres@vitacitas.com', specialty: 'Oftalmología' },
];

const doctorIds = doctors.map(() => uuid());

// Sample appointments
const appointmentDate = new Date();
appointmentDate.setDate(appointmentDate.getDate() + 3);
appointmentDate.setHours(10, 30, 0, 0);

// ---------------------------------------------------------------------------
// Upsert logic
// ---------------------------------------------------------------------------

function upsertUser(user: {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  specialty: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email) as { id: string } | undefined;

  if (existing) {
    console.log(`  ↻ Skipped ${user.email} (already exists)`);
    return existing.id;
  }

  db.prepare(`
    INSERT INTO users (id, name, email, password, role, specialty, phone, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, user.name, user.email, user.password, user.role, user.specialty, user.phone, user.createdAt, user.updatedAt);

  console.log(`  ✓ Created ${user.email} (${user.role})`);
  return user.id;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log('\n🌱 Seeding database...\n');

upsertUser(patient);

doctors.forEach((d, i) => {
  upsertUser({
    id: doctorIds[i],
    name: d.name,
    email: d.email,
    password: hashed,
    role: 'doctor',
    specialty: d.specialty,
    phone: null,
    createdAt: now,
    updatedAt: now,
  });
});

// Create a sample appointment if none exist
const existingAppointments = db.prepare('SELECT COUNT(*) as count FROM appointments').get() as { count: number };

if (existingAppointments.count === 0 && patientId && doctorIds[0]) {
  db.prepare(`
    INSERT INTO appointments (id, patientId, doctorId, dateTime, status, location, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, 'confirmed', ?, ?, ?, ?)
  `).run(uuid(), patientId, doctorIds[0], appointmentDate.toISOString(), 'Consultorio 101, Planta Baja', 'Primera consulta - traer análisis previos.', now, now);

  console.log('  ✓ Created sample appointment');
}

console.log('\n✅ Seed complete!\n');
console.log('─── Test Credentials ───');
console.log('  Patient: test@vitacitas.com / Test123!');
console.log('  Doctors: maria@vitacitas.com / Test123!');
console.log('  (all doctors use Test123!)\n');
