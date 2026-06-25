import { auth } from "./auth";
import { forTenant } from "@/lib/db/tenant-scope";
import { prisma } from "@/lib/db/prisma";
import { tenantBloqueado } from "@/lib/tenants/estado";
import { assertCan, type Permission } from "./permissions";
import type { Role } from "@prisma/client";

// Helpers para obtener el contexto de sesión/tenant en Server Actions y
// Route Handlers. Ver docs/03-rfc-arquitectura.md §3.

export interface SessionContext {
  userId: string;
  tenantId: string | null;
  role: Role;
}

/** Devuelve el contexto de sesión o lanza si no hay sesión válida. */
export async function requireSession(): Promise<SessionContext> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  // Suspensión por mora/inactividad: bloquea también las sesiones ya activas
  // (no solo nuevos logins). El superadmin (tenantId null) no se ve afectado.
  if (session.user.tenantId) {
    const t = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { activo: true, fechaFinContrato: true },
    });
    if (!t || tenantBloqueado(t)) throw new Error("Entidad suspendida o contrato finalizado");
  }

  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    role: session.user.role,
  };
}

/**
 * Exige sesión dentro de un tenant y devuelve el cliente tenant-scoped + contexto.
 * Verifica además el permiso si se indica.
 */
export async function requireTenant(permission?: Permission) {
  const ctx = await requireSession();
  if (!ctx.tenantId) throw new Error("Esta operación requiere un tenant");
  if (permission) assertCan(ctx.role, permission);
  return { ctx, db: forTenant(ctx.tenantId) };
}

/** Exige rol SUPERADMIN. */
export async function requireSuperadmin(): Promise<SessionContext> {
  const ctx = await requireSession();
  if (ctx.role !== "SUPERADMIN") throw new Error("Solo SUPERADMIN");
  return ctx;
}
