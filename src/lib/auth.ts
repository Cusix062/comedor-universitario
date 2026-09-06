import { Estudiante, Admin } from "@/types";
import getDb from "./db";

export interface Session {
  tipo: "estudiante" | "admin";
  id: number;
  usuario: string;
}

const SESSION_SECRET = "comedor-undc-secret-2024";

export function createSession(data: Session): string {
  const payload = {
    ...data,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function getSession(token: string): Session | null {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString());
    if (payload.exp < Date.now()) return null;
    return { tipo: payload.tipo, id: payload.id, usuario: payload.usuario };
  } catch {
    return null;
  }
}

export function authenticateEstudiante(codigo: string): Estudiante | null {
  const db = getDb();
  const estudiante = db.prepare("SELECT * FROM estudiantes WHERE codigo = ?").get(codigo) as Estudiante | undefined;
  return estudiante || null;
}

export function authenticateAdmin(usuario: string, password: string): Admin | null {
  const db = getDb();
  const admin = db.prepare("SELECT * FROM admins WHERE usuario = ? AND password_hash = ?").get(usuario, password) as Admin | undefined;
  return admin || null;
}
