import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "comedor.db");

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initDb(db);
    cargarBeneficiariosSiVacio(db);
  }
  return db;
}

function initDb(database: Database.Database) {
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

    CREATE INDEX IF NOT EXISTS idx_cupos_fecha ON cupos(fecha);
    CREATE INDEX IF NOT EXISTS idx_inscripciones_cupo ON inscripciones(cupo_id);
    CREATE INDEX IF NOT EXISTS idx_inscripciones_estudiante ON inscripciones(estudiante_id);
    CREATE INDEX IF NOT EXISTS idx_estudiantes_codigo ON estudiantes(codigo);

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

    CREATE INDEX IF NOT EXISTS idx_beneficiarios_nombre ON beneficiarios(nombre);
  `);

  // Insertar admin por defecto si no existe
  const adminExists = database.prepare("SELECT id FROM admins WHERE usuario = ?").get("admin");
  if (!adminExists) {
    database.prepare("INSERT INTO admins (usuario, password_hash, nombre) VALUES (?, ?, ?)").run(
      "admin",
      "admin123",
      "Administrador General"
    );
  }
}

function cargarBeneficiariosSiVacio(database: Database.Database) {
  const count = database.prepare("SELECT COUNT(*) as total FROM beneficiarios").get() as any;
  if (count.total > 0) return;

  const jsonPath = path.join(process.cwd(), "data", "beneficiarios.json");
  if (!fs.existsSync(jsonPath)) return;

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  const insert = database.prepare("INSERT INTO beneficiarios (nombre, carrera, ciclo_grupo, turno) VALUES (?, ?, ?, ?)");

  database.transaction(() => {
    for (const nombre of data.almuerzo || []) {
      insert.run(nombre.trim(), "INGENIERÍA DE SISTEMAS", "BENEFICIARIO", "almuerzo");
    }
    for (const nombre of data.cena || []) {
      insert.run(nombre.trim(), "INGENIERÍA DE SISTEMAS", "BENEFICIARIO", "cena");
    }
  })();

  console.log(`✅ ${(data.almuerzo?.length || 0) + (data.cena?.length || 0)} beneficiarios cargados`);
}

export default getDb;
