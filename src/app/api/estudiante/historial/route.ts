import { NextRequest, NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const codigo = searchParams.get("codigo");

    if (!codigo) {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 });
    }

    const db = await getDbAsync();

    const inscripciones = await db.prepare(`
      SELECT 
        i.id,
        i.numero_orden,
        i.estado,
        i.fecha_hora,
        c.fecha,
        c.tipo as turno
      FROM inscripciones i
      JOIN estudiantes e ON i.estudiante_id = e.id
      JOIN cupos c ON i.cupo_id = c.id
      WHERE e.codigo = ?
      ORDER BY c.fecha DESC
    `).all(codigo);

    return NextResponse.json(inscripciones);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
