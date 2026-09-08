import { NextResponse } from "next/server";

export async function GET() {
  // Show ALL env vars related to turso (masked)
  const url = process.env.TURSO_DATABASE_URL || "NOT_SET";
  const token = process.env.TURSO_AUTH_TOKEN || "NOT_SET";

  return NextResponse.json({
    turso_url: url,
    turso_url_length: url.length,
    turso_token_present: token !== "NOT_SET",
    turso_token_length: token.length,
    turso_token_start: token.substring(0, 20),
    all_env_keys: Object.keys(process.env).filter(k =>
      k.includes("TURSO") || k.includes("turso") || k.includes("NEXTAUTH") || k.includes("GOOGLE")
    ),
  });
}
