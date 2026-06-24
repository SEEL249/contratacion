import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "./password";
import { tenantBloqueado } from "@/lib/tenants/estado";
import { authConfig } from "./auth.config";

// Configuración completa de Auth.js (NextAuth v5), runtime Node. Compone sobre la
// config edge-safe (authConfig) y añade el provider con acceso a BD.
// La sesión transporta userId, tenantId y role, fijados en el servidor.

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  // El tenant se resuelve por slug en el login (cada entidad tiene su espacio).
  tenantSlug: z.string().optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        tenantSlug: {},
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password, tenantSlug } = parsed.data;

        // SUPERADMIN: tenantId null. Resto: dentro de un tenant.
        const tenant = tenantSlug
          ? await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
          : null;

        // Suspensión por mora / inactividad: si la entidad está bloqueada,
        // ningún usuario suyo puede iniciar sesión.
        if (tenant && tenantBloqueado(tenant)) return null;

        const user = await prisma.user.findFirst({
          where: { email, tenantId: tenant?.id ?? null, activo: true },
        });
        if (!user?.passwordHash) return null;
        if (!verifyPassword(password, user.passwordHash)) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nombre,
          tenantId: user.tenantId,
          role: user.role,
        };
      },
    }),
  ],
});
