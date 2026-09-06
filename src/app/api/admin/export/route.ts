import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fecha = searchParams.get("fecha") || new Date().toISOString().split("T")[0];

    const db = getDb();

    const inscritos = db.prepare(`
      SELECT 
        i.numero_orden as "N°",
        e.codigo as "Código",
        e.nombre as "Nombre",
        e.correo as "Correo",
        e.ciclo as "Ciclo",
        e.telefono as "Teléfono",
        c.tipo as "Turno",
        i.estado as "Estado",
        i.fecha_hora as "Fecha/Hora Registro"
      FROM inscripciones i
      JOIN estudiantes e ON i.estudiante_id = e.id
      JOIN cupos c ON i.cupo_id = c.id
      WHERE c.fecha = ?
      ORDER BY c.tipo, i.numero_orden
    `).all(fecha);

    // Crear workbook
    const wb = XLSX.utils.book_new();

    // Hoja de almuerzo
    const almuerzos = inscritos.filter((i: any) => i.Turno === "almuerzo");
    const wsAlmuerzo = XLSX.utils.json_to_sheet(almuerzos);
    XLSX.utils.book_append_sheet(wb, wsAlmuerzo, "Almuerzo");

    // Hoja de cena
    const cenas = inscritos.filter((i: any) => i.Turno === "cena");
    const wsCena = XLSX.utils.json_to_sheet(cenas);
    XLSX.utils.book_append_sheet(wb, wsCena, "Cena");

    // Generar buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=inscritos_${fecha}.xlsx`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
