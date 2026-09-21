import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "jairecusi@gmail.com";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  if (path.startsWith("/admin")) {
    if (!token || !token.email || token.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/auth/error?error=access_denied", req.url));
    }
    return NextResponse.next();
  }

  if (path.startsWith("/dashboard") || path.startsWith("/registro") || path.startsWith("/historial")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/registro/:path*",
    "/historial/:path*",
  ],
};
