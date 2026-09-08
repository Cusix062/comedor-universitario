import { NextRequest, NextResponse } from "next/server";
import getDb, { getDbAsync } from "@/lib/db";

// GET: Obtener cupos disponibles para hoy o una fecha específica
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fecha = searchParams.get("fecha") || new Date().toISOString().split("T")[0];

    const db = await getDbAsync();

    // Obtener cupos del día
    const cupos = db.prepare(
      "SELECT * FROM cupos WHERE fecha = ? ORDER BY tipo"
    ).all(fecha);

    // Si no hay cupos para hoy, crear estructura vacía
    if (cupos.length === 0) {
      return NextResponse.json({
        fecha,
        almuerzo: { capacidad: 0, ocupados: 0, estado: "sin_configurar" },
        cena: { capacidad: 0, ocupados: 0, estado: "sin_configurar" },
      });
    }

    const almuerzo = cupos.find((c: any) => c.tipo === "almuerzo") || {
      capacidad: 0, ocupados: 0, estado: "sin_configurar"
    };
    const cena = cupos.find((c: any) => c.tipo === "cena") || {
      capacidad: 0, ocupados: 0, estado: "sin_configurar"
    };

    return NextResponse.json({ fecha, almuerzo, cena });
  } catch (error) {
    console.error("Error al obtener cupos:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
