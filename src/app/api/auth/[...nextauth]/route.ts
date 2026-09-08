import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getDbAsync } from "@/lib/db";
import { getCicloNumero } from "@/lib/ciclos";

const ADMIN_EMAIL = "jairecusi@gmail.com";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      id: "google-student",
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Google({
      id: "google-admin",
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Admin solo por google-admin
      if (account?.provider === "google-admin") {
        return user.email === ADMIN_EMAIL;
      }

      // Estudiantes solo @undc.edu.pe, NO el admin
      if (account?.provider === "google-student") {
        if (user.email === ADMIN_EMAIL) return false;

        const allowed = user.email.endsWith("@undc.edu.pe");
        if (!allowed) return false;

        // Crear o actualizar estudiante en BD con ciclo calculado
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
      }

      return false;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).isAdmin = session.user.email === ADMIN_EMAIL;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
