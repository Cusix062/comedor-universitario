import { NextRequest, NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";
import { calcularCiclo } from "@/lib/ciclos";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const codigo = searchParams.get("codigo");

    if (!codigo) {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 });
    }

    const db = await getDbAsync();

    const estudiante = await db.prepare("SELECT * FROM estudiantes WHERE codigo = ?").get(codigo) as any;

    if (!estudiante) {
      return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 });
    }

    const cicloInfo = calcularCiclo(codigo);

    return NextResponse.json({
      id: estudiante.id,
      codigo: estudiante.codigo,
      nombre: estudiante.nombre,
      correo: estudiante.correo,
      ciclo: cicloInfo?.ciclo || estudiante.ciclo,
      cicloRomano: cicloInfo?.romano || "I",
      telefono: estudiante.telefono,
    });
  } catch (error) {
    console.error("Error al obtener estudiante:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
