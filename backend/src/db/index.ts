import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../data/vitacitas.db');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

// ---------------------------------------------------------------------------
// Statement — wraps sql.js prepared statement with better-sqlite3 API
// ---------------------------------------------------------------------------

class Statement {
  #db: SqlJsDatabase;
  #sql: string;
  #onWrite: () => void;

  constructor(db: SqlJsDatabase, sql: string, onWrite: () => void) {
    this.#db = db;
    this.#sql = sql;
    this.#onWrite = onWrite;
  }

  all(...params: unknown[]): Row[] {
    const stmt = this.#db.prepare(this.#sql);
    if (params.length > 0) stmt.bind(params as SqlJsDatabase.ParameterValue[]);
    const rows: Row[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject() as Row);
    stmt.free();
    return rows;
  }

  get(...params: unknown[]): Row | undefined {
    const stmt = this.#db.prepare(this.#sql);
    if (params.length > 0) stmt.bind(params as SqlJsDatabase.ParameterValue[]);
    const row = stmt.step() ? (stmt.getAsObject() as Row) : undefined;
    stmt.free();
    return row;
  }

  run(...params: unknown[]): RunResult {
    const stmt = this.#db.prepare(this.#sql);
    if (params.length > 0) stmt.bind(params as SqlJsDatabase.ParameterValue[]);
    stmt.step();
    const lastInsertRowid = Number(
      this.#db.exec('SELECT last_insert_rowid() as id')[0]?.values[0] ?? 0,
    );
    const changes = this.#db.getRowsModified();
    stmt.free();
    this.#onWrite(); // persist to disk after every write
    return { changes, lastInsertRowid };
  }
}

// ---------------------------------------------------------------------------
// Database — singleton wrapping sql.js with file persistence
// ---------------------------------------------------------------------------

let instance: SqlJsDatabase | null = null;

function save(): void {
  if (!instance) return;
  const data = instance.export();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function getDb(): SqlJsDatabase {
  if (!instance) throw new Error('Database not initialized. Call db.init() first.');
  return instance;
}

// ---------------------------------------------------------------------------
// Public API (better-sqlite3-compatible)
// ---------------------------------------------------------------------------

const db = {
  async init(): Promise<void> {
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
      instance = new SQL.Database(fs.readFileSync(DB_PATH));
    } else {
      instance = new SQL.Database();
    }

    instance.run('PRAGMA journal_mode=WAL');
    instance.run('PRAGMA foreign_keys=ON');

    runSchema();
    save();
  },

  prepare(sql: string): Statement {
    return new Statement(getDb(), sql, save);
  },

  exec(sql: string): void {
    getDb().run(sql);
    save();
  },

  pragma(str: string): void {
    getDb().run(`PRAGMA ${str}`);
    save();
  },

  close(): void {
    if (instance) {
      save();
      instance.close();
      instance = null;
    }
  },
};

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

function runSchema(): void {
  instance!.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'patient' CHECK(role IN ('patient','doctor','admin')),
      specialty TEXT,
      phone TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL REFERENCES users(id),
      doctorId TEXT NOT NULL REFERENCES users(id),
      dateTime TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('confirmed','pending','cancelled')),
      location TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patientId);
    CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctorId);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `);
}

// Auto-init (safe because tsx handles top-level await in ESM)
await db.init();

export default db;
