import { NextRequest, NextResponse } from "next/server";
import { esBeneficiario, getDbAsync } from "@/lib/db";
import { getCicloNumero } from "@/lib/ciclos";

export async function POST(req: NextRequest) {
  try {
    const { estudiante_id, cupo_id, codigo, nombre, correo } = await req.json();

    if (!cupo_id) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const db = await getDbAsync();

    let idEstudiante = estudiante_id;

    if (!idEstudiante && codigo && nombre) {
      const existente = await db.prepare("SELECT id FROM estudiantes WHERE codigo = ?").get(codigo) as any;
      if (existente) {
        idEstudiante = existente.id;
      } else {
        const cicloCalculado = getCicloNumero(codigo);
        const result = await db.prepare(
          "INSERT INTO estudiantes (codigo, nombre, correo, ciclo, telefono) VALUES (?, ?, ?, ?, ?)"
        ).run(codigo, nombre, correo || `${codigo}@undc.edu.pe`, cicloCalculado, "");
        idEstudiante = result.lastInsertRowid;
      }
    }

    if (!idEstudiante) {
      return NextResponse.json({ error: "No se pudo identificar al estudiante" }, { status: 400 });
    }

    const tipoTurno = await db.prepare("SELECT tipo FROM cupos WHERE id = ?").get(cupo_id) as any;

    if (nombre && tipoTurno) {
      const bloqueado = await esBeneficiario(db, nombre, tipoTurno.tipo);

      if (bloqueado) {
        return NextResponse.json({
          error: "Usted es beneficiario del comedor. No necesita registrarse por esta plataforma."
        }, { status: 403 });
      }
    }

    if (idEstudiante && tipoTurno) {
      const hoy = new Date().toISOString().split("T")[0];
      const turno = tipoTurno.tipo;

      const suspension = await db.prepare(
        `SELECT * FROM suspenciones 
         WHERE estudiante_id = ? 
         AND (tipo = ? OR tipo = 'ambos')
         AND fecha_inicio <= ? AND fecha_fin >= ?`
      ).get(idEstudiante, turno, hoy, hoy) as any;

      if (suspension) {
        const turnoLabel = suspension.tipo === "ambos" ? "ambos turnos" : suspension.tipo;
        return NextResponse.json({
          error: `Usted se encuentra suspendido/a para ${turnoLabel} hasta el ${suspension.fecha_fin}.${suspension.motivo ? ` Motivo: ${suspension.motivo}` : ""}`
        }, { status: 403 });
      }
    }

    const cupo = await db.prepare("SELECT * FROM cupos WHERE id = ? AND estado = 'abierto'").get(cupo_id) as any;
    if (!cupo) {
      return NextResponse.json({ error: "Cupo no encontrado o cerrado" }, { status: 404 });
    }

    if (cupo.ocupados >= cupo.capacidad) {
      return NextResponse.json({ error: "No hay cupos disponibles" }, { status: 409 });
    }

    const existeInscripcion = await db.prepare(
      "SELECT id FROM inscripciones WHERE estudiante_id = ? AND cupo_id = ?"
    ).get(idEstudiante, cupo_id);

    if (existeInscripcion) {
      return NextResponse.json({ error: "Ya estás registrado en este turno" }, { status: 409 });
    }

    const resultado = await db.transaction(async () => {
      const maxOrden = await db.prepare(
        "SELECT COALESCE(MAX(numero_orden), 0) + 1 as siguiente FROM inscripciones WHERE cupo_id = ?"
      ).get(cupo_id) as any;

      const result = await db.prepare(
        "INSERT INTO inscripciones (estudiante_id, cupo_id, numero_orden) VALUES (?, ?, ?)"
      ).run(idEstudiante, cupo_id, maxOrden.siguiente);

      await db.prepare("UPDATE cupos SET ocupados = ocupados + 1 WHERE id = ?").run(cupo_id);

      const cupoActualizado = await db.prepare("SELECT * FROM cupos WHERE id = ?").get(cupo_id) as any;
      if (cupoActualizado.ocupados >= cupoActualizado.capacidad) {
        await db.prepare("UPDATE cupos SET estado = 'cerrado' WHERE id = ?").run(cupo_id);
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
