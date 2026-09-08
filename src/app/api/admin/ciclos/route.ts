import { NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";
import { calcularCiclo } from "@/lib/ciclos";

export async function POST() {
  try {
    const db = await getDbAsync();

    const estudiantes = await db.prepare("SELECT id, codigo, nombre FROM estudiantes").all() as any[];

    let actualizados = 0;
    let sinCiclo = 0;
    const detalles: any[] = [];

    for (const est of estudiantes) {
      const cicloInfo = calcularCiclo(est.codigo);

      if (cicloInfo) {
        await db.prepare("UPDATE estudiantes SET ciclo = ? WHERE id = ?").run(
          cicloInfo.ciclo,
          est.id
        );
        actualizados++;
        detalles.push({
          id: est.id,
          codigo: est.codigo,
          nombre: est.nombre,
          ciclo: cicloInfo.ciclo,
          romano: cicloInfo.romano,
        });
      } else {
        sinCiclo++;
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: `Ciclos actualizados: ${actualizados} | Sin ciclo determinado: ${sinCiclo}`,
      actualizados,
      sinCiclo,
      detalles,
    });
  } catch (error) {
    console.error("Error al actualizar ciclos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await getDbAsync();

    const estudiantes = await db.prepare(
      "SELECT id, codigo, nombre, ciclo FROM estudiantes ORDER BY codigo"
    ).all() as any[];

    const conCicloCalculado = estudiantes.map((est) => {
      const cicloCalculado = calcularCiclo(est.codigo);
      return {
        id: est.id,
        codigo: est.codigo,
        nombre: est.nombre,
        cicloActual: est.ciclo,
        cicloCalculado: cicloCalculado?.ciclo || null,
        romano: cicloCalculado?.romano || null,
        necesitaCambio: cicloCalculado ? est.ciclo !== cicloCalculado.ciclo : false,
      };
    });

    const necesitanCambio = conCicloCalculado.filter((e) => e.necesitaCambio);

    return NextResponse.json({
      total: estudiantes.length,
      necesitanCambio: necesitanCambio.length,
      estudiantes: conCicloCalculado,
    });
  } catch (error) {
    console.error("Error al consultar ciclos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
