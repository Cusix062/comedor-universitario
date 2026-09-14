import { getDbAsync } from "@/lib/db";

async function logAccion(accion: string, detalle: string, usuario: string, ip?: string) {
  try {
    const db = await getDbAsync();
    await db.prepare(
      "INSERT INTO audit_logs (accion, detalle, usuario, ip) VALUES (?, ?, ?, ?)"
    ).run(accion, detalle, usuario, ip || "");
  } catch (error) {
    console.error("Error al registrar auditoría:", error);
  }
}

export { logAccion };
