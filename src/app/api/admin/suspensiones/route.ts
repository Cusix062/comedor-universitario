import { NextRequest, NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";
import { getCicloNumero } from "@/lib/ciclos";

const API_URL = "https://sivireno.undc.edu.pe/tiger/consulta/con_searchEstudiante.php";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const busqueda = searchParams.get("q") || "";
    const soloActivas = searchParams.get("activas") === "true";

    const db = await getDbAsync();
    const hoy = new Date().toISOString().split("T")[0];

    if (soloActivas) {
      const suspendidos = await db.prepare(`
        SELECT s.*, e.codigo, e.nombre, e.correo
        FROM suspenciones s
        JOIN estudiantes e ON s.estudiante_id = e.id
        WHERE s.fecha_fin >= ?
        ORDER BY s.fecha_inicio DESC
      `).all(hoy);

      return NextResponse.json(suspendidos);
    }

    if (busqueda.length < 2) {
      return NextResponse.json([]);
    }

    const normalizar = (str: string): string => {
      return str.trim().toUpperCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[ñÑ]/g, "N")
        .replace(/[^A-Z\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    };

    const busquedaNorm = normalizar(busqueda);

    // 1. Buscar en BD local
    const porCodigo = await db.prepare(
      "SELECT * FROM estudiantes WHERE codigo = ?"
    ).all(busqueda);

    const todos = await db.prepare("SELECT * FROM estudiantes").all() as any[];
    const porNombre = todos.filter((e: any) => {
      const nombreNorm = normalizar(e.nombre);
      return nombreNorm.includes(busquedaNorm);
    });

    const ids = new Set<number>();
    const resultados: any[] = [];

    for (const e of [...porCodigo, ...porNombre]) {
      if (!ids.has(e.id)) {
        ids.add(e.id);
        const suspensiones = await db.prepare(
          "SELECT * FROM suspenciones WHERE estudiante_id = ? AND fecha_fin >= ? ORDER BY fecha_inicio DESC"
        ).all(e.id, hoy);
        resultados.push({ ...e, suspensiones, fuente: "local" });
      }
    }

    // 2. Buscar en API externa UNDC
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opcion: 7, buscador: busqueda }),
      });

      if (response.ok) {
        const apiData = await response.json();
        if (Array.isArray(apiData)) {
          for (const est of apiData) {
            const codigo = est.cod_estu;
            if (ids.has(parseInt(codigo))) continue;

            // Auto-crear en BD local
            const existente = await db.prepare("SELECT id FROM estudiantes WHERE codigo = ?").get(codigo) as any;
            let estudianteId: number;

            if (existente) {
              estudianteId = existente.id;
            } else {
              const cicloCalculado = getCicloNumero(codigo);
              const result = await db.prepare(
                "INSERT INTO estudiantes (codigo, nombre, correo, ciclo, telefono) VALUES (?, ?, ?, ?, ?)"
              ).run(codigo, est.estudiante, `${codigo}@undc.edu.pe`, cicloCalculado, "");
              estudianteId = Number(result.lastInsertRowid);
            }

            ids.add(estudianteId);
            const suspensiones = await db.prepare(
              "SELECT * FROM suspenciones WHERE estudiante_id = ? AND fecha_fin >= ? ORDER BY fecha_inicio DESC"
            ).all(estudianteId, hoy);

            const estLocal = await db.prepare("SELECT * FROM estudiantes WHERE id = ?").get(estudianteId);
            resultados.push({ ...estLocal, suspensiones, fuente: "api" });
          }
        }
      }
    } catch (e) {
      console.error("Error API externa:", e);
    }

    return NextResponse.json(resultados);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

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

    const db = await getDbAsync();

    const superpuesta = await db.prepare(
      `SELECT id FROM suspenciones 
       WHERE estudiante_id = ? AND tipo IN (?, 'ambos') 
       AND fecha_inicio <= ? AND fecha_fin >= ?`
    ).get(estudiante_id, tipo, fecha_fin, fecha_inicio);

    if (superpuesta) {
      return NextResponse.json({ error: "Ya existe una suspensión que se superpone" }, { status: 409 });
    }

    const result = await db.prepare(
      "INSERT INTO suspenciones (estudiante_id, tipo, fecha_inicio, fecha_fin, motivo) VALUES (?, ?, ?, ?, ?)"
    ).run(estudiante_id, tipo, fecha_inicio, fecha_fin, motivo || "");

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      mensaje: "Suspensión creada exitosamente",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, tipo, fecha_inicio, fecha_fin, motivo } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    if (tipo && !["almuerzo", "cena", "ambos"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    if (fecha_inicio && fecha_fin && fecha_inicio > fecha_fin) {
      return NextResponse.json({ error: "La fecha de inicio debe ser anterior a la fecha fin" }, { status: 400 });
    }

    const db = await getDbAsync();

    const actual = await db.prepare("SELECT * FROM suspenciones WHERE id = ?").get(id) as any;
    if (!actual) {
      return NextResponse.json({ error: "Suspensión no encontrada" }, { status: 404 });
    }

    const nuevoTipo = tipo || actual.tipo;
    const nuevaInicio = fecha_inicio || actual.fecha_inicio;
    const nuevaFin = fecha_fin || actual.fecha_fin;
    const nuevoMotivo = motivo !== undefined ? motivo : actual.motivo;

    const superpuesta = await db.prepare(
      `SELECT id FROM suspenciones 
       WHERE id != ? AND estudiante_id = ? AND tipo IN (?, 'ambos') 
       AND fecha_inicio <= ? AND fecha_fin >= ?`
    ).get(id, actual.estudiante_id, nuevoTipo, nuevaFin, nuevaInicio);

    if (superpuesta) {
      return NextResponse.json({ error: "La edición genera superposición con otra suspensión" }, { status: 409 });
    }

    await db.prepare(
      "UPDATE suspenciones SET tipo = ?, fecha_inicio = ?, fecha_fin = ?, motivo = ? WHERE id = ?"
    ).run(nuevoTipo, nuevaInicio, nuevaFin, nuevoMotivo, id);

    return NextResponse.json({ success: true, mensaje: "Suspensión actualizada" });
  } catch (error) {
    console.error("Error:", error);
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
    await db.prepare("DELETE FROM suspenciones WHERE id = ?").run(id);

    return NextResponse.json({ success: true, mensaje: "Suspensión eliminada" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
