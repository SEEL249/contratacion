import type { NextAuthConfig } from "next-auth";

// Config base edge-safe (SIN Prisma ni providers con acceso a BD), compartida por
// el middleware (runtime Edge) y por la config completa en ./auth.ts (Node).
// Patrón "split config" de Auth.js v5. Ver docs/03-rfc-arquitectura.md §3.

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // los providers con BD se añaden en ./auth.ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.tenantId = user.tenantId ?? null;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.tenantId = (token.tenantId as string | null) ?? null;
      session.user.role = token.role as typeof session.user.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
