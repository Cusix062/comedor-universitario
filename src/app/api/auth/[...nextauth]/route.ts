import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getDbAsync } from "@/lib/db";
import { getCicloNumero } from "@/lib/ciclos";

const ADMIN_EMAIL = "jairecusi@gmail.com";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Admin: solo correo autorizado
      if (user.email === ADMIN_EMAIL) return true;

      // Estudiantes: solo @undc.edu.pe
      if (!user.email.endsWith("@undc.edu.pe")) return false;

      // Auto-crear estudiante en BD con ciclo calculado
      try {
        const codigo = user.email.split("@")[0];
        const db = await getDbAsync();
        const existente = await db.prepare("SELECT id FROM estudiantes WHERE codigo = ?").get(codigo);
        if (!existente) {
          const cicloCalculado = getCicloNumero(codigo);
          await db.prepare(
            "INSERT INTO estudiantes (codigo, nombre, correo, ciclo, telefono) VALUES (?, ?, ?, ?, ?)"
          ).run(codigo, user.name || codigo, user.email, cicloCalculado, "");
        }
      } catch (e) {
        console.error("Error creando estudiante:", e);
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).isAdmin = session.user.email === ADMIN_EMAIL;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Después del login, redirigir según el tipo de usuario
      // Si viene del callback de Google, redirigir a la página principal
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/`;
      }
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
