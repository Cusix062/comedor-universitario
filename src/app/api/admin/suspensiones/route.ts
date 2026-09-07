import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

// GET: Buscar estudiantes por codigo o nombre
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const busqueda = searchParams.get("q") || "";

    const db = getDb();

    if (busqueda.length < 2) {
      return NextResponse.json([]);
    }

    const normalizar = (str: string): string => {
      return str.trim().toUpperCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[Ññ]/g, "N")
        .replace(/[^A-Z\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    };

    const busquedaNorm = normalizar(busqueda);

    // Buscar por codigo exacto
    const porCodigo = db.prepare(
      "SELECT * FROM estudiantes WHERE codigo = ?"
    ).all(busqueda);

    // Buscar por nombre (normalizado)
    const todos = db.prepare("SELECT * FROM estudiantes").all() as any[];
    const porNombre = todos.filter((e: any) => {
      const nombreNorm = normalizar(e.nombre);
      return nombreNorm.includes(busquedaNorm) || busquedaNorm.includes(nombreNorm);
    });

    // Combinar resultados sin duplicados
    const ids = new Set<number>();
    const resultados: any[] = [];

    for (const e of [...porCodigo, ...porNombre]) {
      if (!ids.has(e.id)) {
        ids.add(e.id);

        // Obtener suspensiones activas
        const hoy = new Date().toISOString().split("T")[0];
        const suspensiones = db.prepare(
          "SELECT * FROM suspenciones WHERE estudiante_id = ? AND fecha_fin >= ? ORDER BY fecha_inicio DESC"
        ).all(e.id, hoy);

        resultados.push({
          ...e,
          suspensiones,
        });
      }
    }

    return NextResponse.json(resultados);
  } catch (error) {
    console.error("Error buscando:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: Crear suspension
export async function POST(req: NextRequest) {
  try {
    const { estudiante_id, tipo, fecha_inicio, fecha_fin, motivo } = await req.json();

    if (!estudiante_id || !tipo || !fecha_inicio || !fecha_fin) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    if (!["almuerzo", "cena", "ambos"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    if (fecha_inicio > fecha_fin) {
      return NextResponse.json({ error: "La fecha de inicio debe ser anterior a la fecha fin" }, { status: 400 });
    }

    const db = getDb();

    // Verificar que no exista una suspension que se superponga
    const superpuesta = db.prepare(
      `SELECT id FROM suspenciones 
       WHERE estudiante_id = ? AND tipo IN (?, 'ambos') 
       AND fecha_inicio <= ? AND fecha_fin >= ?`
    ).get(estudiante_id, tipo, fecha_fin, fecha_inicio);

    if (superpuesta) {
      return NextResponse.json({ error: "Ya existe una suspensión que se superpone con estas fechas" }, { status: 409 });
    }

    const result = db.prepare(
      "INSERT INTO suspenciones (estudiante_id, tipo, fecha_inicio, fecha_fin, motivo) VALUES (?, ?, ?, ?, ?)"
    ).run(estudiante_id, tipo, fecha_inicio, fecha_fin, motivo || "");

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      mensaje: "Suspensión creada exitosamente",
    });
  } catch (error) {
    console.error("Error creando suspensión:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE: Eliminar suspension
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const db = getDb();
    db.prepare("DELETE FROM suspenciones WHERE id = ?").run(id);

    return NextResponse.json({ success: true, mensaje: "Suspensión eliminada" });
  } catch (error) {
    console.error("Error eliminando suspensión:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
