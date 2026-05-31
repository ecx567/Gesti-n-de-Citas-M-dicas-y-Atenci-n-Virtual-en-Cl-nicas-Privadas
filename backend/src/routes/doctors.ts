import { Router } from 'express';
import db from '../db/index.js';
import type { DoctorInfo } from '../types/index.js';

const router = Router();

// ---------------------------------------------------------------------------
// GET /specialties — list all available medical specialties
// ---------------------------------------------------------------------------

router.get('/specialties', (_req, res) => {
  try {
    const rows = db.prepare(`
      SELECT DISTINCT specialty FROM users
      WHERE role = 'doctor' AND specialty IS NOT NULL
      ORDER BY specialty
    `).all() as { specialty: string }[];

    const specialties = rows.map((r) => r.specialty);
    res.json(specialties);
  } catch (error) {
    console.error('List specialties error:', error);
    res.status(500).json({ error: 'Error al obtener las especialidades.' });
  }
});

// ---------------------------------------------------------------------------
// GET /doctors — list doctors, optionally filtered by specialty
// ---------------------------------------------------------------------------

router.get('/', (req, res) => {
  try {
    const specialty = req.query.specialty as string | undefined;

    let rows: Record<string, unknown>[];

    if (specialty) {
      rows = db.prepare(`
        SELECT id, name, specialty FROM users
        WHERE role = 'doctor' AND specialty = ?
        ORDER BY name
      `).all(specialty) as Record<string, unknown>[];
    } else {
      rows = db.prepare(`
        SELECT id, name, specialty FROM users
        WHERE role = 'doctor'
        ORDER BY name
      `).all() as Record<string, unknown>[];
    }

    const doctors: DoctorInfo[] = rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      specialty: r.specialty as string,
    }));

    res.json(doctors);
  } catch (error) {
    console.error('List doctors error:', error);
    res.status(500).json({ error: 'Error al obtener los doctores.' });
  }
});

export default router;
