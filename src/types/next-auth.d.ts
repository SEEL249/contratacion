import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Augmenta la sesión de Auth.js con tenantId y role. Ver src/lib/auth/auth.ts.

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string | null;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    tenantId: string | null;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId: string | null;
    role: Role;
  }
}
