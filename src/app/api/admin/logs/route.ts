import { NextRequest, NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const accion = searchParams.get("accion");

    const db = await getDbAsync();

    let query = "SELECT * FROM audit_logs";
    const args: any[] = [];

    if (accion) {
      query += " WHERE accion = ?";
      args.push(accion);
    }

    query += " ORDER BY fecha_hora DESC LIMIT ?";
    args.push(limit);

    const logs = await db.prepare(query).all(...args);
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
