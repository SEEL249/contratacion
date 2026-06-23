"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth/session";
import {
  crearContratoInput,
  asignarContratistasInput,
  type CrearContratoInput,
  type AsignarContratistasInput,
} from "./schema";

// Server Actions del módulo de contratos. Toda mutación verifica sesión, permiso
// y tenant (vía requireTenant). El cliente `db` es tenant-scoped: las consultas
// sobre Contrato ya filtran por tenantId automáticamente.

/** Crea un contrato con sus obligaciones. Rol: PERSONA_CONTRATACION. */
export async function crearContrato(input: CrearContratoInput) {
  const { ctx, db } = await requireTenant("contrato:create");
  const data = crearContratoInput.parse(input);

  const contrato = await db.contrato.create({
    data: {
      tenantId: ctx.tenantId!,
      objeto: data.objeto,
      vigenciaInicio: data.vigenciaInicio,
      vigenciaFin: data.vigenciaFin,
      valorTotal: data.valorTotal.toString(),
      valorCuota: data.valorCuota.toString(),
      numeroCuotas: data.numeroCuotas,
      tipoVinculacion: data.tipoVinculacion,
      nivelRiesgoArl: data.nivelRiesgoArl,
      creadorId: ctx.userId,
      obligaciones: {
        create: data.obligaciones.map((o, i) => ({ texto: o.texto, orden: o.orden || i + 1 })),
      },
    },
    select: { id: true },
  });

  revalidatePath("/contratos");
  // Solo campos serializables (los objetos Prisma llevan Decimal, no serializable
  // a través del límite Server Action → cliente).
  return { id: contrato.id };
}

/** Lista los contratos del tenant. */
export async function listarContratos() {
  const { db } = await requireTenant("contrato:read");
  return db.contrato.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      obligaciones: true,
      asignaciones: { include: { contratista: true, supervisor: true } },
    },
  });
}

/** Obtiene un contrato por id (tenant-scoped). */
export async function obtenerContrato(id: string) {
  const { db } = await requireTenant("contrato:read");
  return db.contrato.findUnique({
    where: { id },
    include: {
      obligaciones: { orderBy: { orden: "asc" } },
      asignaciones: { include: { contratista: true, supervisor: true } },
    },
  });
}

/**
 * Asigna el contrato base a uno o varios contratistas. Cada asignación lleva su
 * número de contrato diferenciado. Rol: PERSONA_CONTRATACION.
 */
export async function asignarContratistas(input: AsignarContratistasInput) {
  const { ctx, db } = await requireTenant("contrato:assign");
  const data = asignarContratistasInput.parse(input);

  // 1) El contrato debe pertenecer al tenant (db scoped lo garantiza).
  const contrato = await db.contrato.findUnique({ where: { id: data.contratoId } });
  if (!contrato) throw new Error("Contrato no encontrado en esta entidad");

  // 2) Validar que contratistas y supervisores pertenecen al tenant y tienen rol válido.
  const idsUsuarios = new Set<string>();
  data.asignaciones.forEach((a) => {
    idsUsuarios.add(a.contratistaId);
    if (a.supervisorId) idsUsuarios.add(a.supervisorId);
  });
  const usuarios = await db.user.findMany({ where: { id: { in: [...idsUsuarios] } } });
  const porId = new Map(usuarios.map((u) => [u.id, u]));

  for (const a of data.asignaciones) {
    const c = porId.get(a.contratistaId);
    if (!c || c.role !== "CONTRATISTA") throw new Error("Contratista inválido para esta entidad");
    if (a.supervisorId) {
      const s = porId.get(a.supervisorId);
      if (!s || s.role !== "SUPERVISOR") throw new Error("Supervisor inválido para esta entidad");
    }
  }

  // 3) Crear asignaciones. ContratoContratista no lleva tenantId (cuelga del contrato).
  await db.contratoContratista.createMany({
    data: data.asignaciones.map((a) => ({
      contratoId: data.contratoId,
      contratistaId: a.contratistaId,
      supervisorId: a.supervisorId ?? null,
      numeroContrato: a.numeroContrato,
    })),
    skipDuplicates: true,
  });

  revalidatePath(`/contratos/${data.contratoId}`);
  return { ok: true, creadas: data.asignaciones.length, por: ctx.userId };
}

/** Lista usuarios del tenant por rol (para los selectores de asignación). */
export async function listarUsuariosPorRol(role: "CONTRATISTA" | "SUPERVISOR") {
  const { db } = await requireTenant("contrato:assign");
  return db.user.findMany({
    where: { role, activo: true },
    select: { id: true, nombre: true, email: true, cedula: true },
    orderBy: { nombre: "asc" },
  });
}
