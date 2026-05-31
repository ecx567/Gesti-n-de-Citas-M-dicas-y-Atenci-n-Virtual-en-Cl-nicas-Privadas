import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import type { User } from '../types/index.js';

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeUser(row: Record<string, unknown>): User {
  const { password: _, ...user } = row as User & { password: string };
  return user as User;
}

// ---------------------------------------------------------------------------
// GET /me — current authenticated user profile
// ---------------------------------------------------------------------------

router.get('/me', authenticate, (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as
      | Record<string, unknown>
      | undefined;

    if (!row) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    const user = sanitizeUser(row);
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Error al obtener el perfil.' });
  }
});

// ---------------------------------------------------------------------------
// PUT /users/:id — update user profile
// ---------------------------------------------------------------------------

router.put('/:id', authenticate, (req, res) => {
  try {
    // Users can only update their own profile (admins can update any)
    if (req.user!.userId !== req.params.id && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'No tenés permiso para modificar este perfil.' });
      return;
    }

    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as
      | Record<string, unknown>
      | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    const { name, email, phone, currentPassword, newPassword } = req.body;
    const updates: string[] = [];
    const params: unknown[] = [];

    if (name?.trim()) {
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (email?.trim()) {
      // Check email not taken
      const emailLower = email.trim().toLowerCase();
      const emailTaken = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?')
        .get(emailLower, req.params.id);

      if (emailTaken) {
        res.status(409).json({ error: 'El correo ya está en uso.' });
        return;
      }

      updates.push('email = ?');
      params.push(emailLower);
    }

    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone || null);
    }

    // Password change requires current password verification
    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ error: 'Debés proporcionar tu contraseña actual para cambiarla.' });
        return;
      }

      const row = existing as { password: string };
      if (!bcrypt.compareSync(currentPassword, row.password)) {
        res.status(401).json({ error: 'La contraseña actual no es correcta.' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        return;
      }

      updates.push('password = ?');
      params.push(bcrypt.hashSync(newPassword, 10));
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No hay campos para actualizar.' });
      return;
    }

    const now = new Date().toISOString();
    updates.push('updatedAt = ?');
    params.push(now);
    params.push(req.params.id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as Record<string, unknown>;
    const user = sanitizeUser(updated);

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Error al actualizar el perfil.' });
  }
});

export default router;
