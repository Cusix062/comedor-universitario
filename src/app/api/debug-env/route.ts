import { NextResponse } from "next/server";

export async function GET() {
  const vars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "NOT_SET",
    GOOGLE_CLIENT_ID_len: (process.env.GOOGLE_CLIENT_ID || "").length,
    GOOGLE_CLIENT_SECRET_present: !!process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CLIENT_SECRET_len: (process.env.GOOGLE_CLIENT_SECRET || "").length,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "NOT_SET",
    NEXTAUTH_SECRET_len: (process.env.NEXTAUTH_SECRET || "").length,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT_SET",
  };
  return NextResponse.json(vars);
}
