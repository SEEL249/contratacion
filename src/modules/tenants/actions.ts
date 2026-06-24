"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireSuperadmin } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { crearTenantInput, type CrearTenantInput } from "./schema";

// Server Actions de gestión de entidades (tenants). Solo SUPERADMIN.
// Operan sobre la tabla global Tenant, por eso usan el cliente Prisma "crudo"
// (no el tenant-scoped): el superadmin no pertenece a ningún tenant.

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Lista todas las entidades con conteo de usuarios y contratos. */
export async function listarTenants() {
  await requireSuperadmin();
  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nombre: true,
      slug: true,
      nit: true,
      activo: true,
      createdAt: true,
      _count: { select: { users: true, contratos: true } },
    },
  });
}

/** Crea una entidad y su primer usuario administrador (ADMIN_TENANT). */
export async function crearTenant(input: CrearTenantInput): Promise<ActionResult> {
  await requireSuperadmin();

  const parsed = crearTenantInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;
  const nit = data.nit?.trim() ? data.nit.trim() : null;

  const dupSlug = await prisma.tenant.findUnique({ where: { slug: data.slug } });
  if (dupSlug) return { ok: false, error: `El identificador "${data.slug}" ya está en uso.` };
  if (nit) {
    const dupNit = await prisma.tenant.findUnique({ where: { nit } });
    if (dupNit) return { ok: false, error: `El NIT "${nit}" ya está registrado.` };
  }

  await prisma.tenant.create({
    data: {
      nombre: data.nombre,
      slug: data.slug,
      nit,
      users: {
        create: {
          email: data.adminEmail.toLowerCase(),
          nombre: data.adminNombre,
          role: "ADMIN_TENANT",
          passwordHash: hashPassword(data.adminPassword),
        },
      },
    },
  });

  revalidatePath("/superadmin/tenants");
  return { ok: true };
}

/** Activa o desactiva una entidad (bloquea/permite el acceso de sus usuarios). */
export async function cambiarEstadoTenant(id: string, activo: boolean): Promise<ActionResult> {
  await requireSuperadmin();
  await prisma.tenant.update({ where: { id }, data: { activo } });
  revalidatePath("/superadmin/tenants");
  return { ok: true };
}
