import { NextRequest, NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cupo_id = searchParams.get("cupo_id");
    const fecha = searchParams.get("fecha") || new Date().toISOString().split("T")[0];

    const db = await getDbAsync();

    let inscritos;
    if (cupo_id) {
      inscritos = await db.prepare(`
        SELECT i.*, e.codigo, e.nombre, e.correo, e.ciclo, e.telefono
        FROM inscripciones i
        JOIN estudiantes e ON i.estudiante_id = e.id
        WHERE i.cupo_id = ?
        ORDER BY i.numero_orden
      `).all(cupo_id);
    } else {
      inscritos = await db.prepare(`
        SELECT i.*, e.codigo, e.nombre, e.correo, e.ciclo, e.telefono, c.tipo as turno, c.fecha
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
}

export async function PUT(req: NextRequest) {
  try {
    const { inscripcion_id, accion } = await req.json();

    if (!inscripcion_id || !accion) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const db = await getDbAsync();

    if (accion === "atender") {
      await db.prepare("UPDATE inscripciones SET estado = 'atendido' WHERE id = ?").run(inscripcion_id);
    } else if (accion === "cancelar") {
      const inscripcion = await db.prepare("SELECT cupo_id FROM inscripciones WHERE id = ?").get(inscripcion_id) as any;
      if (inscripcion) {
        await db.transaction(async () => {
          await db.prepare("UPDATE inscripciones SET estado = 'cancelado' WHERE id = ?").run(inscripcion_id);
          await db.prepare("UPDATE cupos SET ocupados = MAX(0, ocupados - 1) WHERE id = ?").run(inscripcion.cupo_id);
          const cupo = await db.prepare("SELECT * FROM cupos WHERE id = ?").get(inscripcion.cupo_id) as any;
          if (cupo && cupo.estado === "cerrado" && cupo.ocupados < cupo.capacidad) {
            await db.prepare("UPDATE cupos SET estado = 'abierto' WHERE id = ?").run(inscripcion.cupo_id);
          }
        })();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inscripcion_id = searchParams.get("id");

    if (!inscripcion_id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const db = await getDbAsync();

    const inscripcion = await db.prepare("SELECT cupo_id FROM inscripciones WHERE id = ?").get(inscripcion_id) as any;
    if (!inscripcion) {
      return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
    }

    await db.transaction(async () => {
      await db.prepare("DELETE FROM inscripciones WHERE id = ?").run(inscripcion_id);
      await db.prepare("UPDATE cupos SET ocupados = MAX(0, ocupados - 1) WHERE id = ?").run(inscripcion.cupo_id);
      const cupo = await db.prepare("SELECT * FROM cupos WHERE id = ?").get(inscripcion.cupo_id) as any;
      if (cupo && cupo.estado === "cerrado" && cupo.ocupados < cupo.capacidad) {
        await db.prepare("UPDATE cupos SET estado = 'abierto' WHERE id = ?").run(inscripcion.cupo_id);
      }
    })();

    return NextResponse.json({ success: true, mensaje: "Inscripción eliminada" });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
