"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireSuperadmin } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { crearTenantInput, actualizarContratoInput, type CrearTenantInput } from "./schema";

// Server Actions de gestión de entidades (tenants). Solo SUPERADMIN.
// Operan sobre la tabla global Tenant (Prisma "crudo": el superadmin no
// pertenece a ningún tenant). La habilitación depende de la VIGENCIA DEL
// CONTRATO de la entidad (adquirido por licitación), no de pagos.

export type ActionResult = { ok: true } | { ok: false; error: string };

const TENANT_SELECT = {
  id: true,
  nombre: true,
  slug: true,
  nit: true,
  activo: true,
  fechaInicioContrato: true,
  fechaFinContrato: true,
  createdAt: true,
  _count: { select: { users: true, contratos: true } },
} as const;

function parseFecha(iso: string | null | undefined): { ok: true; value: Date | null } | { ok: false } {
  if (!iso || !iso.trim()) return { ok: true, value: null };
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? { ok: false } : { ok: true, value: d };
}

/** Lista todas las entidades. */
export async function listarTenants() {
  await requireSuperadmin();
  return prisma.tenant.findMany({ orderBy: { createdAt: "desc" }, select: TENANT_SELECT });
}

/** Detalle de una entidad. */
export async function obtenerTenant(id: string) {
  await requireSuperadmin();
  return prisma.tenant.findUnique({
    where: { id },
    select: {
      ...TENANT_SELECT,
      _count: {
        select: { users: true, contratos: true, cuentasCobro: true, plantillas: true, actas: true },
      },
    },
  });
}

/** Crea una entidad (con su admin) y la vigencia de su contrato. */
export async function crearTenant(input: CrearTenantInput): Promise<ActionResult> {
  await requireSuperadmin();

  const parsed = crearTenantInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;
  const nit = data.nit?.trim() ? data.nit.trim() : null;

  const inicio = parseFecha(data.fechaInicioContrato);
  const fin = parseFecha(data.fechaFinContrato);
  if (!inicio.ok || !fin.ok) return { ok: false, error: "Fecha de contrato inválida." };
  if (!fin.value) return { ok: false, error: "La fecha de fin del contrato es obligatoria." };
  if (inicio.value && fin.value <= inicio.value) {
    return { ok: false, error: "La fecha de fin debe ser posterior a la de inicio." };
  }

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
      fechaInicioContrato: inicio.value,
      fechaFinContrato: fin.value,
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

/** Actualiza/renueva la vigencia del contrato de la entidad. */
export async function actualizarContrato(input: {
  id: string;
  fechaInicioContrato: string | null;
  fechaFinContrato: string | null;
}): Promise<ActionResult> {
  await requireSuperadmin();
  const parsed = actualizarContratoInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const inicio = parseFecha(parsed.data.fechaInicioContrato);
  const fin = parseFecha(parsed.data.fechaFinContrato);
  if (!inicio.ok || !fin.ok) return { ok: false, error: "Fecha inválida." };
  if (!fin.value) return { ok: false, error: "La fecha de fin del contrato es obligatoria." };
  if (inicio.value && fin.value <= inicio.value) {
    return { ok: false, error: "La fecha de fin debe ser posterior a la de inicio." };
  }

  await prisma.tenant.update({
    where: { id: parsed.data.id },
    data: { fechaInicioContrato: inicio.value, fechaFinContrato: fin.value },
  });
  revalidatePath(`/superadmin/tenants/${parsed.data.id}`);
  revalidatePath("/superadmin/tenants");
  return { ok: true };
}

/** Habilita o deshabilita manualmente una entidad (independiente del contrato). */
export async function cambiarEstadoTenant(id: string, activo: boolean): Promise<ActionResult> {
  await requireSuperadmin();
  await prisma.tenant.update({ where: { id }, data: { activo } });
  revalidatePath(`/superadmin/tenants/${id}`);
  revalidatePath("/superadmin/tenants");
  return { ok: true };
}

/**
 * Vacía los datos operativos (contratos, cuentas, informes, actas, plantillas)
 * conservando la entidad y sus usuarios (cascada desde Contrato).
 */
export async function vaciarDatosTenant(id: string): Promise<ActionResult> {
  await requireSuperadmin();
  await prisma.$transaction([
    prisma.contrato.deleteMany({ where: { tenantId: id } }),
    prisma.plantilla.deleteMany({ where: { tenantId: id } }),
  ]);
  revalidatePath(`/superadmin/tenants/${id}`);
  revalidatePath("/superadmin/tenants");
  return { ok: true };
}

/** Elimina por completo la entidad y TODOS sus datos y usuarios (cascada). */
export async function eliminarTenant(id: string): Promise<ActionResult> {
  await requireSuperadmin();
  await prisma.tenant.delete({ where: { id } });
  revalidatePath("/superadmin/tenants");
  return { ok: true };
}
