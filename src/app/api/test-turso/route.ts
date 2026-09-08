import { NextResponse } from "next/server";

export async function GET() {
  try {
    const TURSO_URL = process.env.TURSO_DATABASE_URL;
    const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

    if (!TURSO_URL) {
      return NextResponse.json({
        error: "TURSO_DATABASE_URL no está configurada",
        hint: "Ve a Vercel > Settings > Environment Variables",
      });
    }

    if (!TURSO_TOKEN) {
      return NextResponse.json({
        error: "TURSO_AUTH_TOKEN no está configurado",
        hint: "Ve a Vercel > Settings > Environment Variables",
      });
    }

    const { createClient } = await import("@libsql/client");
    const client = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });

    const result = await client.execute("SELECT 1 as test");

    return NextResponse.json({
      ok: true,
      message: "Turso conectado correctamente",
      test: result.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      hint: "Verifica que TURSO_DATABASE_URL y TURSO_AUTH_TOKEN sean correctos",
    }, { status: 500 });
  }
}
