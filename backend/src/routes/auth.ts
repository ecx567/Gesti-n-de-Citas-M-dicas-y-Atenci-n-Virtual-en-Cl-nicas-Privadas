import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import db from '../db/index.js';
import type { User, AuthResponse, TokenPayload } from '../types/index.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-dev-secret';
const JWT_EXPIRES_IN = Number(process.env.JWT_EXPIRES_IN ?? 3600);
const JWT_REFRESH_EXPIRES_IN = Number(process.env.JWT_REFRESH_EXPIRES_IN ?? 604800);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTokens(user: User): { accessToken: string; refreshToken: string; expiresIn: number } {
  const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken, expiresIn: JWT_EXPIRES_IN };
}

function sanitizeUser(row: Record<string, unknown>): User {
  const { password: _, ...user } = row as User & { password: string };
  return user as User;
}

// ---------------------------------------------------------------------------
// POST /auth/register
// ---------------------------------------------------------------------------

router.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (existing) {
      res.status(409).json({ error: 'El correo ya está registrado.' });
      return;
    }

    const id = uuid();
    const now = new Date().toISOString();
    const hashed = bcrypt.hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (id, name, email, password, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 'patient', ?, ?)
    `).run(id, name.trim(), email.trim().toLowerCase(), hashed, now, now);

    const user = sanitizeUser(
      db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown>,
    );
    const tokens = generateTokens(user);

    const response: AuthResponse = { ...tokens, user };
    res.status(201).json(response);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
      return;
    }

    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase()) as
      | (Record<string, unknown> & { password: string })
      | undefined;

    if (!row || !bcrypt.compareSync(password, row.password)) {
      res.status(401).json({ error: 'Credenciales inválidas.' });
      return;
    }

    const user = sanitizeUser(row);
    const tokens = generateTokens(user);

    const response: AuthResponse = { ...tokens, user };
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/refresh
// ---------------------------------------------------------------------------

router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token requerido.' });
      return;
    }

    const payload = jwt.verify(refreshToken, JWT_SECRET) as TokenPayload;

    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as
      | (Record<string, unknown> & { password: string })
      | undefined;

    if (!row) {
      res.status(401).json({ error: 'Usuario no encontrado.' });
      return;
    }

    const user = sanitizeUser(row);
    const tokens = generateTokens(user);

    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Refresh token inválido o expirado.' });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/logout
// ---------------------------------------------------------------------------

router.post('/logout', (_req, res) => {
  // Stateless JWT — client discards tokens. No server-side invalidation needed.
  // In production, add a token blacklist or Redis-based invalidation.
  res.json({ message: 'Sesión cerrada exitosamente.' });
});

// ---------------------------------------------------------------------------
// POST /auth/forgot-password
// ---------------------------------------------------------------------------

router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      res.status(400).json({ error: 'El correo electrónico es obligatorio.' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());

    // Always return success to prevent email enumeration
    if (!existing) {
      res.json({ message: 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.' });
      return;
    }

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    console.log(`[FORGOT-PASSWORD] Would send reset email to: ${email}`);

    res.json({ message: 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.' });
  } catch (error) {
    console.error('Forgot-password error:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
