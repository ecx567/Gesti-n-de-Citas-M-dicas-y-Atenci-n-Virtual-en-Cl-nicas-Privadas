import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import appointmentRoutes from './routes/appointments.js';
import doctorRoutes from './routes/doctors.js';
import userRoutes from './routes/users.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/auth', authRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/specialties', doctorRoutes);
app.use('/doctors', doctorRoutes);
app.use('/users', userRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`\n  🏥 VitaCitas API running at http://localhost:${PORT}\n`);
  console.log(`  ─── Endpoints ───`);
  console.log(`  Auth:       POST /auth/{login,register,refresh,logout,forgot-password}`);
  console.log(`  Appointments: GET|POST /appointments`);
  console.log(`  Appointments: GET|DELETE /appointments/:id`);
  console.log(`  Specialties: GET /specialties`);
  console.log(`  Doctors:    GET /doctors[?specialty=X]`);
  console.log(`  Profile:    GET /users/me`);
  console.log(`  Profile:    PUT /users/:id`);
  console.log(`  Health:     GET /health\n`);
});
