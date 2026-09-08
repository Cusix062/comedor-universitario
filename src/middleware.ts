import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_EMAIL = "jairecusi@gmail.com";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Si tiene sesión de Google, verificar que sea permitido
  if (token && token.email) {
    const email = token.email;
    if (email !== ADMIN_EMAIL && !email.endsWith("@undc.edu.pe")) {
      // No tiene permiso - cerrar sesión y redirigir al error
      const errorUrl = new URL("/auth/error", req.url);
      errorUrl.searchParams.set("error", "access_denied");
      const response = NextResponse.redirect(errorUrl);
      // Limpiar la cookie de sesión
      response.cookies.set("next-auth.session-token", "", { maxAge: 0 });
      response.cookies.set("__Secure-next-auth.session-token", "", { maxAge: 0 });
      return response;
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
