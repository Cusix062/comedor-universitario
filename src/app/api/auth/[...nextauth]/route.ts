import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getDbAsync } from "@/lib/db";
import { getCicloNumero } from "@/lib/ciclos";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "jairecusi@gmail.com";

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

      if (user.email === ADMIN_EMAIL) return true;

      if (!user.email.endsWith("@undc.edu.pe")) return false;

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
        console.error("Error creando estudiante (no bloqueante):", e);
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).isAdmin = token.email === ADMIN_EMAIL;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
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
