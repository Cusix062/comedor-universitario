import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

// GET: Obtener formatos guardados
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fecha = searchParams.get("fecha");
    const tipo = searchParams.get("tipo");

    const db = getDb();

    if (fecha && tipo) {
      const formato = db.prepare(
        "SELECT * FROM formatos_guardados WHERE fecha = ? AND tipo = ?"
      ).get(fecha, tipo);
      return NextResponse.json(formato || null);
    }

    const formatos = db.prepare(
      "SELECT * FROM formatos_guardados ORDER BY fecha DESC, tipo"
    ).all();
    return NextResponse.json(formatos);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: Guardar formato
export async function POST(req: NextRequest) {
  try {
    const { fecha, tipo, capacidad, cantidad_inscritos, inscritos_json } = await req.json();

    if (!fecha || !tipo || !inscritos_json) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const db = getDb();

    db.prepare(`
      INSERT INTO formatos_guardados (fecha, tipo, capacidad, cantidad_inscritos, inscritos_json)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(fecha, tipo) DO UPDATE SET
        capacidad = excluded.capacidad,
        cantidad_inscritos = excluded.cantidad_inscritos,
        inscritos_json = excluded.inscritos_json,
        guardado_en = CURRENT_TIMESTAMP
    `).run(fecha, tipo, capacidad || 30, cantidad_inscritos || 0, JSON.stringify(inscritos_json));

    return NextResponse.json({ success: true, mensaje: "Formato guardado correctamente" });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
