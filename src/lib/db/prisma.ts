import { PrismaClient } from "@prisma/client";

// Singleton del cliente Prisma (evita múltiples instancias en dev/HMR).
// ⚠️ No usar este cliente "crudo" desde la capa de dominio: usar el wrapper
// tenant-scoped (ver ./tenant-scope.ts) para garantizar aislamiento multi-tenant.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
