import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

// GET: Obtener todos los cupos (admin)
export async function GET() {
  try {
    const db = getDb();
    const cupos = db.prepare(
      "SELECT * FROM cupos ORDER BY fecha DESC, tipo"
    ).all();
    return NextResponse.json(cupos);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: Crear o actualizar cupos para una fecha
export async function POST(req: NextRequest) {
  try {
    const { fecha, almuerzo_capacidad, cena_capacidad } = await req.json();

    if (!fecha) {
      return NextResponse.json({ error: "La fecha es obligatoria" }, { status: 400 });
    }

    const db = getDb();

    const resultado = db.transaction(() => {
      // Upsert almuerzo
      if (almuerzo_capacidad !== undefined) {
        const existente = db.prepare(
          "SELECT id, ocupados FROM cupos WHERE fecha = ? AND tipo = 'almuerzo'"
        ).get(fecha) as any;

        if (existente) {
          // No bajar la capacidad por debajo de ocupados
          const nuevaCapacidad = Math.max(almuerzo_capacidad, existente.ocupados);
          db.prepare(
            "UPDATE cupos SET capacidad = ?, estado = CASE WHEN capacidad > ocupados THEN 'abierto' ELSE 'cerrado' END WHERE id = ?"
          ).run(nuevaCapacidad, existente.id);
        } else {
          db.prepare(
            "INSERT INTO cupos (fecha, tipo, capacidad) VALUES (?, 'almuerzo', ?)"
          ).run(fecha, almuerzo_capacidad);
        }
      }

      // Upsert cena
      if (cena_capacidad !== undefined) {
        const existente = db.prepare(
          "SELECT id, ocupados FROM cupos WHERE fecha = ? AND tipo = 'cena'"
        ).get(fecha) as any;

        if (existente) {
          const nuevaCapacidad = Math.max(cena_capacidad, existente.ocupados);
          db.prepare(
            "UPDATE cupos SET capacidad = ?, estado = CASE WHEN capacidad > ocupados THEN 'abierto' ELSE 'cerrado' END WHERE id = ?"
          ).run(nuevaCapacidad, existente.id);
        } else {
          db.prepare(
            "INSERT INTO cupos (fecha, tipo, capacidad) VALUES (?, 'cena', ?)"
          ).run(fecha, cena_capacidad);
        }
      }
    })();

    return NextResponse.json({ success: true, mensaje: "Cupos actualizados correctamente" });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
