import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ADMIN_EMAIL = "jairecusi@gmail.com";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        // Permitir correo admin
        if (user.email === ADMIN_EMAIL) {
          return true;
        }
        // Permitir correos institucionales UNDC
        if (user.email.endsWith("@undc.edu.pe")) {
          return true;
        }
      }
      return false;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        // Marcar si es admin
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
