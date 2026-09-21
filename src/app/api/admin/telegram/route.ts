import { NextRequest, NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";
import { enviarReporteTurno } from "@/lib/telegram";
import { requireAdmin } from "@/lib/security";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  try {
    const { fecha, turno } = await req.json();
    const fechaConsulta = fecha || new Date().toISOString().split("T")[0];
    const turnoConsulta = turno || "almuerzo";

    const db = await getDbAsync();

    const inscritos = await db.prepare(`
      SELECT i.numero_orden, e.nombre, e.codigo, e.ciclo
      FROM inscripciones i
      JOIN estudiantes e ON i.estudiante_id = e.id
      JOIN cupos c ON i.cupo_id = c.id
      WHERE c.fecha = ? AND c.tipo = ?
      ORDER BY i.numero_orden
    `).all(fechaConsulta, turnoConsulta) as any[];

    const cap = await db.prepare("SELECT capacidad FROM cupos WHERE fecha = ? AND tipo = ?").get(fechaConsulta, turnoConsulta) as any;

    const enviado = await enviarReporteTurno(
      fechaConsulta,
      turnoConsulta as "almuerzo" | "cena",
      inscritos,
      cap?.capacidad || 0
    );

    if (enviado) {
      return NextResponse.json({ success: true, mensaje: `Reporte de ${turnoConsulta} enviado a Telegram` });
    } else {
      return NextResponse.json({ error: "Error al enviar reporte" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
