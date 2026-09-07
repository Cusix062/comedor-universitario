import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { estudiante_id, cupo_id, codigo, nombre, correo } = await req.json();

    if (!cupo_id) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const db = getDb();

    // Si es usuario de Google (sin estudiante_id), crear o buscar estudiante
    let idEstudiante = estudiante_id;

    if (!idEstudiante && codigo && nombre) {
      // Buscar si ya existe
      const existente = db.prepare("SELECT id FROM estudiantes WHERE codigo = ?").get(codigo) as any;
      if (existente) {
        idEstudiante = existente.id;
      } else {
        // Crear nuevo estudiante
        const result = db.prepare(
          "INSERT INTO estudiantes (codigo, nombre, correo, ciclo, telefono) VALUES (?, ?, ?, ?, ?)"
        ).run(codigo, nombre, correo || `${codigo}@undc.edu.pe`, 1, "");
        idEstudiante = result.lastInsertRowid;
      }
    }

    if (!idEstudiante) {
      return NextResponse.json({ error: "No se pudo identificar al estudiante" }, { status: 400 });
    }

    // Verificar que el cupo existe y tiene espacio
    const cupo = db.prepare("SELECT * FROM cupos WHERE id = ? AND estado = 'abierto'").get(cupo_id) as any;
    if (!cupo) {
      return NextResponse.json({ error: "Cupo no encontrado o cerrado" }, { status: 404 });
    }

    if (cupo.ocupados >= cupo.capacidad) {
      return NextResponse.json({ error: "No hay cupos disponibles" }, { status: 409 });
    }

    // Verificar que el estudiante no esté ya registrado en este turno
    const existeInscripcion = db.prepare(
      "SELECT id FROM inscripciones WHERE estudiante_id = ? AND cupo_id = ?"
    ).get(idEstudiante, cupo_id);

    if (existeInscripcion) {
      return NextResponse.json({ error: "Ya estás registrado en este turno" }, { status: 409 });
    }

    // Transacción atómica para registrar
    const resultado = db.transaction(() => {
      const maxOrden = db.prepare(
        "SELECT COALESCE(MAX(numero_orden), 0) + 1 as siguiente FROM inscripciones WHERE cupo_id = ?"
      ).get(cupo_id) as any;

      const result = db.prepare(
        "INSERT INTO inscripciones (estudiante_id, cupo_id, numero_orden) VALUES (?, ?, ?)"
      ).run(idEstudiante, cupo_id, maxOrden.siguiente);

      db.prepare("UPDATE cupos SET ocupados = ocupados + 1 WHERE id = ?").run(cupo_id);

      const cupoActualizado = db.prepare("SELECT * FROM cupos WHERE id = ?").get(cupo_id) as any;
      if (cupoActualizado.ocupados >= cupoActualizado.capacidad) {
        db.prepare("UPDATE cupos SET estado = 'cerrado' WHERE id = ?").run(cupo_id);
      }

      return {
        inscripcion_id: result.lastInsertRowid,
        numero_orden: maxOrden.siguiente,
      };
    })();

    return NextResponse.json({
      success: true,
      inscripcion_id: resultado.inscripcion_id,
      numero_orden: resultado.numero_orden,
      mensaje: `Inscripción exitosa. Tu número de cupo es #${resultado.numero_orden}`,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
