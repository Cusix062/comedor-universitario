import { NextRequest, NextResponse } from "next/server";
import { buscarEstudiante } from "@/lib/academic-api";
import getDb from "@/lib/db";
import { createSession, authenticateEstudiante } from "@/lib/auth";
import { getCicloNumero } from "@/lib/ciclos";

export async function POST(req: NextRequest) {
  try {
    const { codigo, correo } = await req.json();

    if (!codigo) {
      return NextResponse.json({ error: "El código de estudiante es obligatorio" }, { status: 400 });
    }

    const db = getDb();

    // Buscar en la API académica
    const apiResult = await buscarEstudiante(codigo);

    if (!apiResult) {
      return NextResponse.json({ error: "Estudiante no encontrado en la API académica" }, { status: 404 });
    }

    // Verificar si el estudiante ya existe en nuestra BD
    let estudiante = db.prepare("SELECT * FROM estudiantes WHERE codigo = ?").get(codigo) as any;

    if (!estudiante) {
      // Crear nuevo estudiante con datos de la API
      const correoInstitucional = correo || `${codigo}@undc.edu.pe`;
      const cicloCalculado = getCicloNumero(codigo);
      const result = db.prepare(
        "INSERT INTO estudiantes (codigo, nombre, correo, ciclo, telefono) VALUES (?, ?, ?, ?, ?)"
      ).run(codigo, apiResult.estudiante, correoInstitucional, cicloCalculado, "");

      estudiante = db.prepare("SELECT * FROM estudiantes WHERE id = ?").get(result.lastInsertRowid);
    }

    // Crear sesión
    const session = createSession({
      tipo: "estudiante",
      id: estudiante.id,
      usuario: estudiante.codigo,
    });

    return NextResponse.json({
      success: true,
      session,
      estudiante: {
        id: estudiante.id,
        codigo: estudiante.codigo,
        nombre: estudiante.nombre,
        correo: estudiante.correo,
        ciclo: estudiante.ciclo,
        telefono: estudiante.telefono,
      },
    });
  } catch (error) {
    console.error("Error en autenticación:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
