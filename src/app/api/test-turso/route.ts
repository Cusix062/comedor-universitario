import { NextResponse } from "next/server";

export async function GET() {
  try {
    const TURSO_URL = process.env.TURSO_DATABASE_URL;
    const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

    if (!TURSO_URL) {
      return NextResponse.json({ error: "TURSO_DATABASE_URL not set" });
    }

    const { createClient } = await import("@libsql/client");
    const client = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });

    // Test connection
    const result = await client.execute("SELECT 1 as test");

    // Test table creation
    await client.execute(`
      CREATE TABLE IF NOT EXISTS test_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
      )
    `);

    // Test insert
    await client.execute({
      sql: "INSERT INTO test_table (name) VALUES (?)",
      args: ["test"],
    });

    // Test select
    const rows = await client.execute("SELECT * FROM test_table");

    // Cleanup
    await client.execute("DROP TABLE test_table");

    return NextResponse.json({
      ok: true,
      url: TURSO_URL.substring(0, 30) + "...",
      test: result.rows[0],
      rows: rows.rows.length,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      code: error.code,
      stack: error.stack,
    }, { status: 500 });
  }
}
