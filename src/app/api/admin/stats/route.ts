import { NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";
import { requireAdmin } from "@/lib/security";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  try {
    const db = await getDbAsync();

    const today = new Date();
    const fechas: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      fechas.push(d.toISOString().split("T")[0]);
    }

    const inscriptionsPerDay: { fecha: string; almuerzo: number; cena: number; total: number }[] = [];

    for (const fecha of fechas) {
      const rows = await db.prepare(`
        SELECT c.tipo, COUNT(*) as cantidad
        FROM inscripciones i
        JOIN cupos c ON i.cupo_id = c.id
        WHERE c.fecha = ?
        GROUP BY c.tipo
      `).all(fecha) as any[];

      let almuerzo = 0;
      let cena = 0;
      for (const row of rows) {
        if (row.tipo === "almuerzo") almuerzo = Number(row.cantidad);
        if (row.tipo === "cena") cena = Number(row.cantidad);
      }
      inscriptionsPerDay.push({ fecha, almuerzo, cena, total: almuerzo + cena });
    }

    const turnoTotals = await db.prepare(`
      SELECT c.tipo, COUNT(*) as cantidad
      FROM inscripciones i
      JOIN cupos c ON i.cupo_id = c.id
      GROUP BY c.tipo
    `).all() as any[];

    let almuerzoTotal = 0;
    let cenaTotal = 0;
    for (const row of turnoTotals) {
      if (row.tipo === "almuerzo") almuerzoTotal = Number(row.cantidad);
      if (row.tipo === "cena") cenaTotal = Number(row.cantidad);
    }

    const totalStudents = await db.prepare(
      "SELECT COUNT(*) as total FROM estudiantes"
    ).get() as any;

    const cuposRows = await db.prepare(`
      SELECT tipo, SUM(capacidad) as total_cap, SUM(ocupados) as total_ocup
      FROM cupos
      WHERE fecha >= ? AND fecha <= ?
      GROUP BY tipo
    `).all(fechas[0], fechas[fechas.length - 1]) as any[];

    let occupancyRate = 0;
    if (cuposRows.length > 0) {
      let totalCap = 0;
      let totalOcup = 0;
      for (const row of cuposRows) {
        totalCap += Number(row.total_cap);
        totalOcup += Number(row.total_ocup);
      }
      occupancyRate = totalCap > 0 ? Math.round((totalOcup / totalCap) * 100) : 0;
    }

    return NextResponse.json({
      inscriptionsPerDay,
      almuerzoTotal,
      cenaTotal,
      totalStudents: Number(totalStudents?.total || 0),
      occupancyRate,
    });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
