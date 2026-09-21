import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "jairecusi@gmail.com";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) {
    return { authorized: false, response: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  if (session.user.email !== ADMIN_EMAIL) {
    return { authorized: false, response: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }
  return { authorized: true, session };
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.email) {
    return { authorized: false, response: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  return { authorized: true, session };
}
