import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_EMAIL = "jairecusi@gmail.com";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  if (token && token.email) {
    const email = token.email;
    const isAdmin = email === ADMIN_EMAIL;

    // Admin pages: solo el admin
    if (path.startsWith("/admin")) {
      if (!isAdmin) {
        const res = NextResponse.redirect(new URL("/auth/error?error=access_denied", req.url));
        res.cookies.set("next-auth.session-token", "", { maxAge: 0 });
        res.cookies.set("__Secure-next-auth.session-token", "", { maxAge: 0 });
        return res;
      }
    }

    // Student pages: admin no puede entrar
    if (path.startsWith("/registro") || path.startsWith("/dashboard")) {
      if (isAdmin) {
        const res = NextResponse.redirect(new URL("/auth/error?error=access_denied", req.url));
        res.cookies.set("next-auth.session-token", "", { maxAge: 0 });
        res.cookies.set("__Secure-next-auth.session-token", "", { maxAge: 0 });
        return res;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/registro/:path*",
    "/admin/:path*",
  ],
};
