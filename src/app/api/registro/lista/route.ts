import { NextRequest, NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";
import { requireAuth } from "@/lib/security";
import { withRateLimit } from "@/lib/api-helpers";

export const GET = withRateLimit(async (req: NextRequest) => {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const fecha = searchParams.get("fecha") || new Date().toISOString().split("T")[0];
    const turno = searchParams.get("turno"); // "almuerzo" o "cena" o null (todos)

    const db = await getDbAsync();

    let inscritos;
    if (turno) {
      inscritos = await db.prepare(`
        SELECT i.numero_orden, i.estado, e.codigo, e.nombre, e.ciclo, c.tipo as turno
        FROM inscripciones i
        JOIN estudiantes e ON i.estudiante_id = e.id
        JOIN cupos c ON i.cupo_id = c.id
        WHERE c.fecha = ? AND c.tipo = ?
        ORDER BY i.numero_orden
      `).all(fecha, turno);
    } else {
      inscritos = await db.prepare(`
        SELECT i.numero_orden, i.estado, e.codigo, e.nombre, e.ciclo, c.tipo as turno
        FROM inscripciones i
        JOIN estudiantes e ON i.estudiante_id = e.id
        JOIN cupos c ON i.cupo_id = c.id
        WHERE c.fecha = ?
        ORDER BY c.tipo, i.numero_orden
      `).all(fecha);
    }

    return NextResponse.json(inscritos);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
});
