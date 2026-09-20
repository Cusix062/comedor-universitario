import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_EMAIL = "jairecusi@gmail.com";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  // Si no hay token, dejar pasar (login page o public)
  if (!token || !token.email) {
    return NextResponse.next();
  }

  const isAdmin = token.email === ADMIN_EMAIL;

  // Admin pages: solo el admin
  if (path.startsWith("/admin")) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/auth/error?error=access_denied", req.url));
    }
  }

  // Student pages: admin no puede entrar
  if (path.startsWith("/registro") || path.startsWith("/dashboard") || path.startsWith("/historial")) {
    if (isAdmin) {
      return NextResponse.redirect(new URL("/auth/error?error=access_denied", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/registro/:path*",
    "/historial/:path*",
    "/admin/:path*",
  ],
};
