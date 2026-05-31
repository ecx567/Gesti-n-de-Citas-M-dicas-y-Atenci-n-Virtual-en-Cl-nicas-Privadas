import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import type { AppointmentApi, PaginatedResponse } from '../types/index.js';

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToAppointmentApi(row: Record<string, unknown>): AppointmentApi {
  return {
    id: row.id as string,
    doctor: {
      id: row.doctorId as string,
      name: row.doctorName as string,
      specialty: row.doctorSpecialty as string,
    },
    patientId: row.patientId as string,
    dateTime: row.dateTime as string,
    status: row.status as AppointmentApi['status'],
    location: row.location as string,
    notes: (row.notes as string) ?? undefined,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

// ---------------------------------------------------------------------------
// GET /appointments — paginated, optionally filtered by status
// ---------------------------------------------------------------------------

router.get('/', authenticate, (req, res) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const status = req.query.status as string | undefined;

    const conditions: string[] = [];
    const params: unknown[] = [];

    // Patients see their own appointments; doctors see theirs; admins see all
    if (role === 'patient') {
      conditions.push('a.patientId = ?');
      params.push(userId);
    } else if (role === 'doctor') {
      conditions.push('a.doctorId = ?');
      params.push(userId);
    }

    if (status) {
      conditions.push('a.status = ?');
      params.push(status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`
      SELECT COUNT(*) as total
      FROM appointments a
      ${where}
    `).get(...params) as { total: number };

    const total = countRow.total;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const rows = db.prepare(`
      SELECT
        a.*,
        d.name as doctorName,
        d.specialty as doctorSpecialty
      FROM appointments a
      JOIN users d ON d.id = a.doctorId
      ${where}
      ORDER BY a.dateTime DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as Record<string, unknown>[];

    const data = rows.map(rowToAppointmentApi);

    const response: PaginatedResponse<AppointmentApi> = {
      data,
      meta: { total, page, limit, totalPages },
    };

    res.json(response);
  } catch (error) {
    console.error('List appointments error:', error);
    res.status(500).json({ error: 'Error al obtener las citas.' });
  }
});

// ---------------------------------------------------------------------------
// GET /appointments/:id
// ---------------------------------------------------------------------------

router.get('/:id', authenticate, (req, res) => {
  try {
    const row = db.prepare(`
      SELECT
        a.*,
        d.name as doctorName,
        d.specialty as doctorSpecialty
      FROM appointments a
      JOIN users d ON d.id = a.doctorId
      WHERE a.id = ?
    `).get(req.params.id) as Record<string, unknown> | undefined;

    if (!row) {
      res.status(404).json({ error: 'Cita no encontrada.' });
      return;
    }

    res.json({ data: rowToAppointmentApi(row) });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Error al obtener la cita.' });
  }
});

// ---------------------------------------------------------------------------
// POST /appointments
// ---------------------------------------------------------------------------

router.post('/', authenticate, (req, res) => {
  try {
    const { doctorId, dateTime, location, notes } = req.body;
    const patientId = req.user!.userId;

    if (!doctorId || !dateTime || !location) {
      res.status(400).json({ error: 'doctorId, dateTime y location son obligatorios.' });
      return;
    }

    // Verify doctor exists and is actually a doctor
    const doctor = db.prepare('SELECT id, role FROM users WHERE id = ?').get(doctorId) as
      | { id: string; role: string }
      | undefined;

    if (!doctor || doctor.role !== 'doctor') {
      res.status(400).json({ error: 'Doctor no encontrado.' });
      return;
    }

    const id = uuid();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO appointments (id, patientId, doctorId, dateTime, status, location, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 'confirmed', ?, ?, ?, ?)
    `).run(id, patientId, doctorId, dateTime, location, notes ?? null, now, now);

    const row = db.prepare(`
      SELECT
        a.*,
        d.name as doctorName,
        d.specialty as doctorSpecialty
      FROM appointments a
      JOIN users d ON d.id = a.doctorId
      WHERE a.id = ?
    `).get(id) as Record<string, unknown>;

    res.status(201).json({ data: rowToAppointmentApi(row) });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Error al crear la cita.' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /appointments/:id — cancel an appointment
// ---------------------------------------------------------------------------

router.delete('/:id', authenticate, (req, res) => {
  try {
    const row = db.prepare('SELECT id, patientId, status FROM appointments WHERE id = ?').get(req.params.id) as
      | { id: string; patientId: string; status: string }
      | undefined;

    if (!row) {
      res.status(404).json({ error: 'Cita no encontrada.' });
      return;
    }

    // Only the patient who owns the appointment can cancel
    if (row.patientId !== req.user!.userId) {
      res.status(403).json({ error: 'No tenés permiso para cancelar esta cita.' });
      return;
    }

    if (row.status === 'cancelled') {
      res.status(400).json({ error: 'La cita ya está cancelada.' });
      return;
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE appointments SET status = ?, updatedAt = ? WHERE id = ?')
      .run('cancelled', now, req.params.id);

    res.status(204).send();
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Error al cancelar la cita.' });
  }
});

export default router;
