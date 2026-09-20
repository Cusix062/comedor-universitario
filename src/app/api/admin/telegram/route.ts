import { NextRequest, NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";
import { enviarReporteDiario } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const { fecha } = await req.json();
    const fechaConsulta = fecha || new Date().toISOString().split("T")[0];

    const db = await getDbAsync();

    const almuerzos = await db.prepare(`
      SELECT i.numero_orden, e.nombre, e.codigo, e.ciclo
      FROM inscripciones i
      JOIN estudiantes e ON i.estudiante_id = e.id
      JOIN cupos c ON i.cupo_id = c.id
      WHERE c.fecha = ? AND c.tipo = 'almuerzo'
      ORDER BY i.numero_orden
    `).all(fechaConsulta) as any[];

    const cenas = await db.prepare(`
      SELECT i.numero_orden, e.nombre, e.codigo, e.ciclo
      FROM inscripciones i
      JOIN estudiantes e ON i.estudiante_id = e.id
      JOIN cupos c ON i.cupo_id = c.id
      WHERE c.fecha = ? AND c.tipo = 'cena'
      ORDER BY i.numero_orden
    `).all(fechaConsulta) as any[];

    const capAlm = await db.prepare("SELECT capacidad FROM cupos WHERE fecha = ? AND tipo = 'almuerzo'").get(fechaConsulta) as any;
    const capCena = await db.prepare("SELECT capacidad FROM cupos WHERE fecha = ? AND tipo = 'cena'").get(fechaConsulta) as any;

    const enviado = await enviarReporteDiario(
      fechaConsulta,
      almuerzos,
      cenas,
      capAlm?.capacidad || 0,
      capCena?.capacidad || 0
    );

    if (enviado) {
      return NextResponse.json({ success: true, mensaje: "Reporte enviado a Telegram" });
    } else {
      return NextResponse.json({ error: "Error al enviar reporte" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
