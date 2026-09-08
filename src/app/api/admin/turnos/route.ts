import { NextRequest, NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDbAsync();
    const cupos = await db.prepare(
      "SELECT * FROM cupos ORDER BY fecha DESC, tipo"
    ).all();
    return NextResponse.json(cupos);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fecha, almuerzo_capacidad, cena_capacidad } = await req.json();

    if (!fecha) {
      return NextResponse.json({ error: "La fecha es obligatoria" }, { status: 400 });
    }

    const db = await getDbAsync();

    await db.transaction(async () => {
      if (almuerzo_capacidad !== undefined) {
        const existente = await db.prepare(
          "SELECT id, ocupados FROM cupos WHERE fecha = ? AND tipo = 'almuerzo'"
        ).get(fecha) as any;

        if (existente) {
          const nuevaCapacidad = Math.max(almuerzo_capacidad, existente.ocupados);
          await db.prepare(
            "UPDATE cupos SET capacidad = ?, estado = CASE WHEN capacidad > ocupados THEN 'abierto' ELSE 'cerrado' END WHERE id = ?"
          ).run(nuevaCapacidad, existente.id);
        } else {
          await db.prepare(
            "INSERT INTO cupos (fecha, tipo, capacidad) VALUES (?, 'almuerzo', ?)"
          ).run(fecha, almuerzo_capacidad);
        }
      }

      if (cena_capacidad !== undefined) {
        const existente = await db.prepare(
          "SELECT id, ocupados FROM cupos WHERE fecha = ? AND tipo = 'cena'"
        ).get(fecha) as any;

        if (existente) {
          const nuevaCapacidad = Math.max(cena_capacidad, existente.ocupados);
          await db.prepare(
            "UPDATE cupos SET capacidad = ?, estado = CASE WHEN capacidad > ocupados THEN 'abierto' ELSE 'cerrado' END WHERE id = ?"
          ).run(nuevaCapacidad, existente.id);
        } else {
          await db.prepare(
            "INSERT INTO cupos (fecha, tipo, capacidad) VALUES (?, 'cena', ?)"
          ).run(fecha, cena_capacidad);
        }
      }
    })();

    return NextResponse.json({ success: true, mensaje: "Cupos actualizados correctamente" });
  } catch (error: any) {
    console.error("TURNOS POST ERROR:", error?.message, error?.cause?.message);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, capacidad, estado } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const db = await getDbAsync();

    const cupo = await db.prepare("SELECT * FROM cupos WHERE id = ?").get(id) as any;
    if (!cupo) {
      return NextResponse.json({ error: "Cupo no encontrado" }, { status: 404 });
    }

    const nuevaCapacidad = capacidad !== undefined ? Math.max(capacidad, cupo.ocupados) : cupo.capacidad;
    const nuevoEstado = estado || (nuevaCapacidad > cupo.ocupados ? "abierto" : "cerrado");

    await db.prepare("UPDATE cupos SET capacidad = ?, estado = ? WHERE id = ?").run(
      nuevaCapacidad,
      nuevoEstado,
      id
    );

    return NextResponse.json({ success: true, mensaje: "Cupo actualizado" });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const db = await getDbAsync();

    const cupo = await db.prepare("SELECT * FROM cupos WHERE id = ?").get(id) as any;
    if (!cupo) {
      return NextResponse.json({ error: "Cupo no encontrado" }, { status: 404 });
    }

    if (cupo.ocupados > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar: hay inscripciones activas" },
        { status: 400 }
      );
    }

    await db.prepare("DELETE FROM cupos WHERE id = ?").run(id);

    return NextResponse.json({ success: true, mensaje: "Cupo eliminado" });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
