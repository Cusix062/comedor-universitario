import { createClient, Client } from "@libsql/client";
import path from "path";
import fs from "fs";

// Turso connection
const TURSO_URL = process.env.TURSO_DATABASE_URL || "file:local.db";
const TURSO_AUTH = process.env.TURSO_AUTH_TOKEN || "";

let client: Client;
let initialized = false;

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: TURSO_URL,
      authToken: TURSO_AUTH,
    });
  }
  return client;
}

// Wrapper that mimics better-sqlite3 API for compatibility
class DatabaseWrapper {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  prepare(sql: string) {
    const client = this.client;
    return {
      get(...args: any[]) {
        return client.execute({ sql, args }).then(r => r.rows[0] || null);
      },
      all(...args: any[]) {
        return client.execute({ sql, args }).then(r => r.rows);
      },
      run(...args: any[]) {
        return client.execute({ sql, args }).then(r => ({
          changes: r.rowsAffected,
          lastInsertRowid: Number(r.lastInsertRowid),
        }));
      },
    };
  }

  exec(sql: string) {
    return this.client.executeMultiple(sql);
  }

  pragma(pragma: string) {
    // Turso handles pragmas differently, ignore for now
  }

  transaction(fn: () => void) {
    const client = this.client;
    return async () => {
      await client.execute("BEGIN TRANSACTION");
      try {
        await fn();
        await client.execute("COMMIT");
      } catch (e) {
        await client.execute("ROLLBACK");
        throw e;
      }
    };
  }
}

async function initDb(database: Client) {
  await database.executeMultiple(`
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
      carrera TEXT DEFAULT 'INGENIERÍA DE SISTEMAS',
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
  `);

  // Insertar admin por defecto si no existe
  const adminResult = await database.execute({
    sql: "SELECT id FROM admins WHERE usuario = ?",
    args: ["admin"],
  });

  if (adminResult.rows.length === 0) {
    await database.execute({
      sql: "INSERT INTO admins (usuario, password_hash, nombre) VALUES (?, ?, ?)",
      args: ["admin", "Chester2006@", "Administrador General"],
    });
  }
}

async function cargarBeneficiariosSiVacio(database: Client) {
  const countResult = await database.execute("SELECT COUNT(*) as total FROM beneficiarios");
  const count = countResult.rows[0];
  if (count && Number(count.total) > 0) return;

  const jsonPath = path.join(process.cwd(), "data", "beneficiarios.json");
  if (!fs.existsSync(jsonPath)) return;

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);

  for (const nombre of data.almuerzo || []) {
    await database.execute({
      sql: "INSERT INTO beneficiarios (nombre, carrera, ciclo_grupo, turno) VALUES (?, ?, ?, ?)",
      args: [nombre.trim(), "INGENIERÍA DE SISTEMAS", "BENEFICIARIO", "almuerzo"],
    });
  }
  
  for (const nombre of data.cena || []) {
    await database.execute({
      sql: "INSERT INTO beneficiarios (nombre, carrera, ciclo_grupo, turno) VALUES (?, ?, ?, ?)",
      args: [nombre.trim(), "INGENIERÍA DE SISTEMAS", "BENEFICIARIO", "cena"],
    });
  }

  console.log(`✅ ${(data.almuerzo?.length || 0) + (data.cena?.length || 0)} beneficiarios cargados`);
}

async function esBeneficiario(database: any, nombre: string, turno: string): Promise<boolean> {
  if (!nombre || !turno) return false;

  const normalizar = (str: string): string => {
    return str.trim().toUpperCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[Ññ]/g, "N")
      .replace(/[^A-Z\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const nombreNorm = normalizar(nombre);

  const result = await database.prepare(
    "SELECT nombre FROM beneficiarios WHERE turno = ?"
  ).all(turno);

  for (const b of result) {
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

// Main function to get database
async function getDbAsync(): Promise<DatabaseWrapper> {
  const c = getClient();
  
  if (!initialized) {
    await initDb(c);
    await cargarBeneficiariosSiVacio(c);
    initialized = true;
  }
  
  return new DatabaseWrapper(c);
}

// Sync wrapper for compatibility (uses cached data)
let cachedDb: DatabaseWrapper | null = null;

function getDb(): any {
  if (!cachedDb) {
    const c = getClient();
    cachedDb = new DatabaseWrapper(c);
    
    // Initialize in background
    if (!initialized) {
      initDb(c).then(() => cargarBeneficiariosSiVacio(c)).then(() => {
        initialized = true;
      });
    }
  }
  return cachedDb;
}

export default getDb;
export { getDbAsync, esBeneficiario, getClient };
