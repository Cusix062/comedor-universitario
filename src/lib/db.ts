import path from "path";
import fs from "fs";

const IS_VERCEL = !!process.env.TURSO_DATABASE_URL;
const DB_PATH = path.join(process.cwd(), "data", "comedor.db");

let cachedDb: any = null;
let tursoClient: any = null;

// ─── LOCAL: better-sqlite3 (sync) ───────────────────────────────────────
function getDbLocal(): any {
  if (cachedDb) return cachedDb;
  const Database = require("better-sqlite3");
  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  initSchemaSync(database);
  loadBeneficiariosSync(database);
  cachedDb = database;
  return cachedDb;
}

// ─── VERCEL: Turso (async) ──────────────────────────────────────────────
async function getDbTurso(): Promise<any> {
  if (tursoClient) return tursoClient;

  const { createClient } = await import("@libsql/client");
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nombre TEXT NOT NULL DEFAULT 'Administrador'
    );
    CREATE TABLE IF NOT EXISTS estudiantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL,
      ciclo INTEGER NOT NULL,
      telefono TEXT NOT NULL DEFAULT '',
      id_externo TEXT DEFAULT '',
      fecha_egreso TEXT DEFAULT NULL,
      carrera TEXT DEFAULT 'INGENIERIA DE SISTEMAS',
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS cupos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('almuerzo', 'cena')),
      capacidad INTEGER NOT NULL DEFAULT 50,
      ocupados INTEGER NOT NULL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'abierto' CHECK(estado IN ('abierto', 'cerrado', 'pausado')),
      UNIQUE(fecha, tipo)
    );
    CREATE TABLE IF NOT EXISTS inscripciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estudiante_id INTEGER NOT NULL,
      cupo_id INTEGER NOT NULL,
      numero_orden INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'reservado' CHECK(estado IN ('reservado', 'atendido', 'cancelado')),
      fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(estudiante_id, cupo_id)
    );
    CREATE TABLE IF NOT EXISTS formatos_guardados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('almuerzo', 'cena')),
      capacidad INTEGER NOT NULL,
      cantidad_inscritos INTEGER NOT NULL,
      inscritos_json TEXT NOT NULL,
      guardado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(fecha, tipo)
    );
    CREATE TABLE IF NOT EXISTS beneficiarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      carrera TEXT NOT NULL,
      ciclo_grupo TEXT NOT NULL,
      turno TEXT NOT NULL CHECK(turno IN ('almuerzo', 'cena'))
    );
    CREATE TABLE IF NOT EXISTS suspenciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estudiante_id INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('almuerzo', 'cena', 'ambos')),
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT NOT NULL,
      motivo TEXT NOT NULL DEFAULT '',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const adminResult = await client.execute({ sql: "SELECT id FROM admins WHERE usuario = ?", args: ["admin"] });
  if (adminResult.rows.length === 0) {
    await client.execute({
      sql: "INSERT INTO admins (usuario, password_hash, nombre) VALUES (?, ?, ?)",
      args: ["admin", "Chester2006@", "Administrador General"],
    });
  }

  const countResult = await client.execute("SELECT COUNT(*) as total FROM beneficiarios");
  if (Number(countResult.rows[0].total) === 0) {
    const jsonPath = path.join(process.cwd(), "data", "beneficiarios.json");
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, "utf-8");
      const data = JSON.parse(raw);
      for (const nombre of data.almuerzo || []) {
        await client.execute({
          sql: "INSERT INTO beneficiarios (nombre, carrera, ciclo_grupo, turno) VALUES (?, ?, ?, ?)",
          args: [nombre.trim(), "INGENIERIA DE SISTEMAS", "BENEFICIARIO", "almuerzo"],
        });
      }
      for (const nombre of data.cena || []) {
        await client.execute({
          sql: "INSERT INTO beneficiarios (nombre, carrera, ciclo_grupo, turno) VALUES (?, ?, ?, ?)",
          args: [nombre.trim(), "INGENIERIA DE SISTEMAS", "BENEFICIARIO", "cena"],
        });
      }
    }
  }

  tursoClient = client;
  return client;
}

// ─── SHARED SCHEMA (local) ──────────────────────────────────────────────
function initSchemaSync(database: any) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nombre TEXT NOT NULL DEFAULT 'Administrador'
    );
    CREATE TABLE IF NOT EXISTS estudiantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL,
      ciclo INTEGER NOT NULL,
      telefono TEXT NOT NULL DEFAULT '',
      id_externo TEXT DEFAULT '',
      fecha_egreso TEXT DEFAULT NULL,
      carrera TEXT DEFAULT 'INGENIERIA DE SISTEMAS',
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS cupos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('almuerzo', 'cena')),
      capacidad INTEGER NOT NULL DEFAULT 50,
      ocupados INTEGER NOT NULL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'abierto' CHECK(estado IN ('abierto', 'cerrado', 'pausado')),
      UNIQUE(fecha, tipo)
    );
    CREATE TABLE IF NOT EXISTS inscripciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estudiante_id INTEGER NOT NULL,
      cupo_id INTEGER NOT NULL,
      numero_orden INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'reservado' CHECK(estado IN ('reservado', 'atendido', 'cancelado')),
      fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
      FOREIGN KEY (cupo_id) REFERENCES cupos(id),
      UNIQUE(estudiante_id, cupo_id)
    );
    CREATE TABLE IF NOT EXISTS formatos_guardados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('almuerzo', 'cena')),
      capacidad INTEGER NOT NULL,
      cantidad_inscritos INTEGER NOT NULL,
      inscritos_json TEXT NOT NULL,
      guardado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(fecha, tipo)
    );
    CREATE TABLE IF NOT EXISTS beneficiarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      carrera TEXT NOT NULL,
      ciclo_grupo TEXT NOT NULL,
      turno TEXT NOT NULL CHECK(turno IN ('almuerzo', 'cena'))
    );
    CREATE TABLE IF NOT EXISTS suspenciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estudiante_id INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('almuerzo', 'cena', 'ambos')),
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT NOT NULL,
      motivo TEXT NOT NULL DEFAULT '',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id)
    );
    CREATE INDEX IF NOT EXISTS idx_cupos_fecha ON cupos(fecha);
    CREATE INDEX IF NOT EXISTS idx_inscripciones_cupo ON inscripciones(cupo_id);
    CREATE INDEX IF NOT EXISTS idx_inscripciones_estudiante ON inscripciones(estudiante_id);
    CREATE INDEX IF NOT EXISTS idx_estudiantes_codigo ON estudiantes(codigo);
    CREATE INDEX IF NOT EXISTS idx_beneficiarios_nombre ON beneficiarios(nombre);
    CREATE INDEX IF NOT EXISTS idx_suspenciones_estudiante ON suspenciones(estudiante_id);
    CREATE INDEX IF NOT EXISTS idx_suspenciones_fechas ON suspenciones(fecha_inicio, fecha_fin);
  `);

  const adminExists = database.prepare("SELECT id FROM admins WHERE usuario = ?").get("admin");
  if (!adminExists) {
    database.prepare("INSERT INTO admins (usuario, password_hash, nombre) VALUES (?, ?, ?)").run(
      "admin", "Chester2006@", "Administrador General"
    );
  }
}

function loadBeneficiariosSync(database: any) {
  const count = database.prepare("SELECT COUNT(*) as total FROM beneficiarios").get();
  if (count && count.total > 0) return;

  const jsonPath = path.join(process.cwd(), "data", "beneficiarios.json");
  if (!fs.existsSync(jsonPath)) return;

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);
  const insert = database.prepare("INSERT INTO beneficiarios (nombre, carrera, ciclo_grupo, turno) VALUES (?, ?, ?, ?)");

  database.transaction(() => {
    for (const nombre of data.almuerzo || []) {
      insert.run(nombre.trim(), "INGENIERIA DE SISTEMAS", "BENEFICIARIO", "almuerzo");
    }
    for (const nombre of data.cena || []) {
      insert.run(nombre.trim(), "INGENIERIA DE SISTEMAS", "BENEFICIARIO", "cena");
    }
  })();
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────

// getDb() - sync only for local use (components, etc.)
function getDb(): any {
  if (IS_VERCEL) throw new Error("getDb() not available on Vercel - use getDbAsync()");
  return getDbLocal();
}

// getDbAsync() - returns a Turso-compatible async client
// On local: wraps better-sqlite3 with async interface
// On Vercel: returns raw Turso client
async function getDbAsync(): Promise<any> {
  if (IS_VERCEL) {
    const client = await getDbTurso();
    return {
      prepare(sql: string) {
        return {
          async get(...args: any[]) {
            const r = await client.execute({ sql, args });
            return r.rows[0] || null;
          },
          async all(...args: any[]) {
            const r = await client.execute({ sql, args });
            return r.rows;
          },
          async run(...args: any[]) {
            const r = await client.execute({ sql, args });
            return { changes: r.rowsAffected, lastInsertRowid: Number(r.lastInsertRowid) };
          },
        };
      },
      async exec(sql: string) {
        await client.executeMultiple(sql);
      },
      transaction(fn: (...args: any[]) => any) {
        return async (...args: any[]) => {
          await client.execute("BEGIN");
          try {
            const result = await fn(...args);
            await client.execute("COMMIT");
            return result;
          } catch (e) {
            await client.execute("ROLLBACK");
            throw e;
          }
        };
      },
    };
  }
  return getDbLocal();
}

async function esBeneficiario(database: any, nombre: string, turno: string): Promise<boolean> {
  if (!nombre || !turno) return false;

  const normalizar = (str: string): string => {
    return str.trim().toUpperCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[ñÑ]/g, "N")
      .replace(/[^A-Z\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const nombreNorm = normalizar(nombre);
  const todos = await database.prepare("SELECT nombre FROM beneficiarios WHERE turno = ?").all(turno);

  for (const b of todos) {
    const nombreBD = normalizar(b.nombre as string);
    if (nombreNorm === nombreBD) return true;

    const palabrasBusqueda = nombreNorm.split(" ").filter((p: string) => p.length >= 3);
    const palabrasBD = nombreBD.split(" ").filter((p: string) => p.length >= 3);

    if (palabrasBusqueda.length >= 2 && palabrasBD.length >= 2) {
      const topBusqueda = palabrasBusqueda.slice(0, 3);
      const topBD = palabrasBD.slice(0, 3);
      let coincidencias = 0;
      for (const pb of topBusqueda) {
        if (topBD.includes(pb)) coincidencias++;
      }
      if (coincidencias >= 2) return true;
    }
  }

  return false;
}

export default getDb;
export { esBeneficiario, getDbAsync, IS_VERCEL };
