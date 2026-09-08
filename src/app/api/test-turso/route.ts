import { NextResponse } from "next/server";

export async function GET() {
  try {
    const TURSO_URL = process.env.TURSO_DATABASE_URL!;
    const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN!;

    // Try both URL formats
    const url1 = TURSO_URL;
    const url2 = TURSO_URL.replace("libsql://", "https://");

    let client;
    let usedUrl = url1;

    const { createClient } = await import("@libsql/client");

    try {
      client = createClient({ url: url1, authToken: TURSO_TOKEN });
      await client.execute("SELECT 1");
    } catch {
      usedUrl = url2;
      client = createClient({ url: url2, authToken: TURSO_TOKEN });
      await client.execute("SELECT 1");
    }

    return NextResponse.json({
      ok: true,
      usedUrl: usedUrl,
      message: "Turso conectado!",
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, { status: 500 });
  }
}
