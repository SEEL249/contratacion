"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireSuperadmin } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { calcularVencimiento, type Plan, PLANES } from "@/lib/tenants/plan";
import { renovarSuscripcion } from "@/lib/tenants/billing";
import { crearTenantInput, type CrearTenantInput } from "./schema";

// Server Actions de gestión de entidades (tenants). Solo SUPERADMIN.
// Operan sobre la tabla global Tenant, por eso usan el cliente Prisma "crudo"
// (no el tenant-scoped): el superadmin no pertenece a ningún tenant.

export type ActionResult = { ok: true } | { ok: false; error: string };

const TENANT_SELECT = {
  id: true,
  nombre: true,
  slug: true,
  nit: true,
  activo: true,
  plan: true,
  fechaVencimiento: true,
  createdAt: true,
  _count: { select: { users: true, contratos: true } },
} as const;

/** Lista todas las entidades con conteo de usuarios y contratos. */
export async function listarTenants() {
  await requireSuperadmin();
  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    select: TENANT_SELECT,
  });
}

/** Detalle de una entidad. */
export async function obtenerTenant(id: string) {
  await requireSuperadmin();
  return prisma.tenant.findUnique({
    where: { id },
    select: {
      ...TENANT_SELECT,
      _count: {
        select: {
          users: true,
          contratos: true,
          cuentasCobro: true,
          plantillas: true,
          actas: true,
        },
      },
    },
  });
}

/** Fija o limpia la fecha de vencimiento (suspensión automática por mora). */
export async function actualizarVencimiento(
  id: string,
  fechaISO: string | null,
): Promise<ActionResult> {
  await requireSuperadmin();
  const fecha = fechaISO && fechaISO.trim() ? new Date(fechaISO) : null;
  if (fecha && Number.isNaN(fecha.getTime())) {
    return { ok: false, error: "Fecha inválida." };
  }
  await prisma.tenant.update({ where: { id }, data: { fechaVencimiento: fecha } });
  revalidatePath(`/superadmin/tenants/${id}`);
  revalidatePath("/superadmin/tenants");
  return { ok: true };
}

/**
 * Vacía los datos operativos de la entidad (contratos, cuentas, informes, actas,
 * plantillas) conservando la entidad y sus usuarios. El borrado de contratos
 * arrastra en cascada asignaciones, cuentas, informes, anexos, firmas y revisiones.
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
      plan: data.plan,
      // Vencimiento inicial = creación + periodo del plan.
      fechaVencimiento: calcularVencimiento(new Date(), data.plan),
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

/** Cambia el plan y recalcula el vencimiento a partir de la fecha de creación. */
export async function cambiarPlan(id: string, plan: string): Promise<ActionResult> {
  await requireSuperadmin();
  if (!(PLANES as string[]).includes(plan)) return { ok: false, error: "Plan inválido." };
  const t = await prisma.tenant.findUnique({ where: { id }, select: { createdAt: true } });
  if (!t) return { ok: false, error: "Entidad no encontrada." };
  await prisma.tenant.update({
    where: { id },
    data: { plan: plan as Plan, fechaVencimiento: calcularVencimiento(t.createdAt, plan as Plan) },
  });
  revalidatePath(`/superadmin/tenants/${id}`);
  revalidatePath("/superadmin/tenants");
  return { ok: true };
}

/**
 * Registra un pago: renueva el servicio un periodo del plan y reactiva la entidad.
 * Es el punto que dispararía la reactivación automática cuando el pago se refleja
 * (botón del superadmin hoy; puede invocarse desde un webhook de la pasarela/banco).
 */
export async function registrarPago(id: string): Promise<ActionResult> {
  await requireSuperadmin();
  const res = await renovarSuscripcion(id);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath(`/superadmin/tenants/${id}`);
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
