import { NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";
import { requireAdmin } from "@/lib/security";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  try {
    const db = await getDbAsync();

    const tables = [
      "estudiantes",
      "cupos",
      "inscripciones",
      "beneficiarios",
      "suspenciones",
      "audit_logs",
    ];

    const backup: Record<string, any[]> = {};

    for (const table of tables) {
      backup[table] = await db.prepare(`SELECT * FROM ${table}`).all();
    }

    return NextResponse.json(backup, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-comedor-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al generar backup" }, { status: 500 });
  }
}
