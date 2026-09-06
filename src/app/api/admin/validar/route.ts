import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

// GET: Obtener inscritos de un cupo
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cupo_id = searchParams.get("cupo_id");
    const fecha = searchParams.get("fecha") || new Date().toISOString().split("T")[0];

    const db = getDb();

    let inscritos;
    if (cupo_id) {
      inscritos = db.prepare(`
        SELECT i.*, e.codigo, e.nombre, e.correo, e.ciclo, e.telefono
        FROM inscripciones i
        JOIN estudiantes e ON i.estudiante_id = e.id
        WHERE i.cupo_id = ?
        ORDER BY i.numero_orden
      `).all(cupo_id);
    } else {
      // Obtener todos los inscritos del día
      inscritos = db.prepare(`
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

// PUT: Marcar como atendido
export async function PUT(req: NextRequest) {
  try {
    const { inscripcion_id, accion } = await req.json();

    if (!inscripcion_id || !accion) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const db = getDb();

    if (accion === "atender") {
      db.prepare("UPDATE inscripciones SET estado = 'atendido' WHERE id = ?").run(inscripcion_id);
    } else if (accion === "cancelar") {
      // Obtener el cupo para decrementar ocupados
      const inscripcion = db.prepare("SELECT cupo_id FROM inscripciones WHERE id = ?").get(inscripcion_id) as any;
      if (inscripcion) {
        db.transaction(() => {
          db.prepare("UPDATE inscripciones SET estado = 'cancelado' WHERE id = ?").run(inscripcion_id);
          db.prepare("UPDATE cupos SET ocupados = MAX(0, ocupados - 1) WHERE id = ?").run(inscripcion.cupo_id);
          // Reabrir cupo si estaba cerrado por capacidad
          const cupo = db.prepare("SELECT * FROM cupos WHERE id = ?").get(inscripcion.cupo_id) as any;
          if (cupo && cupo.estado === "cerrado" && cupo.ocupados < cupo.capacidad) {
            db.prepare("UPDATE cupos SET estado = 'abierto' WHERE id = ?").run(inscripcion.cupo_id);
          }
        })();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
