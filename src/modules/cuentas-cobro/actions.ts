"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth/session";
import {
  crearCuentaCobroInput,
  guardarFirmaInput,
  type CrearCuentaCobroInput,
  type GuardarFirmaInput,
} from "./schema";

// Server Actions de cuentas de cobro. Regla clave: N.º de cuentas = N.º de cuotas
// (correspondencia 1:1, cuenta N ↔ cuota N). Ver docs/00...§8.

/** Lista las asignaciones del contratista autenticado (para "seleccionar contrato"). */
export async function listarAsignacionesDelContratista() {
  const { ctx, db } = await requireTenant("cuentaCobro:create");
  return db.contratoContratista.findMany({
    where: { contratistaId: ctx.userId },
    include: { contrato: true, cuentasCobro: { select: { numeroCuota: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Crea la cuenta de cobro de la siguiente cuota disponible para una asignación
 * del contratista. Precarga datos del contrato y crea el informe (shell).
 */
export async function crearCuentaCobro(input: CrearCuentaCobroInput) {
  const { ctx, db } = await requireTenant("cuentaCobro:create");
  const data = crearCuentaCobroInput.parse(input);

  // 1) La asignación debe ser del contratista autenticado.
  const asignacion = await db.contratoContratista.findUnique({
    where: { id: data.asignacionId },
    include: { contrato: true, contratista: true, cuentasCobro: true },
  });
  if (!asignacion || asignacion.contratistaId !== ctx.userId) {
    throw new Error("Asignación no encontrada para este contratista");
  }

  // 2) Siguiente cuota (1:1). No superar el número de cuotas del contrato.
  const siguienteCuota = asignacion.cuentasCobro.length + 1;
  if (siguienteCuota > asignacion.contrato.numeroCuotas) {
    throw new Error("Ya se generaron todas las cuentas de cobro de este contrato");
  }

  // 3) Crear cuenta con snapshot del contrato + informe vacío.
  const cuenta = await db.cuentaCobro.create({
    data: {
      tenantId: ctx.tenantId!,
      asignacionId: asignacion.id,
      numeroCuota: siguienteCuota,
      plataformaSeguridadSocial: data.plataformaSeguridadSocial,
      numeroPlanilla: data.numeroPlanilla,
      tipoPlanilla: data.tipoPlanilla,
      tipoVinculacion: data.tipoVinculacion,
      nombreContratista: asignacion.contratista.nombre,
      cedulaContratista: asignacion.contratista.cedula ?? "",
      valorTotalContrato: asignacion.contrato.valorTotal,
      valorCuota: asignacion.contrato.valorCuota,
      numeroCuotasContrato: asignacion.contrato.numeroCuotas,
      // tenantId explícito: la extensión tenant-scoped NO inyecta en creates anidados.
      informe: { create: { tenantId: ctx.tenantId! } },
    },
    select: { id: true },
  });

  revalidatePath("/cuentas-cobro");
  // Solo el id (los objetos Prisma llevan Decimal, no serializable a cliente).
  return { id: cuenta.id };
}

/** Lista las cuentas de cobro del contratista autenticado. */
export async function listarCuentasDelContratista() {
  const { ctx, db } = await requireTenant("cuentaCobro:read");
  return db.cuentaCobro.findMany({
    where: { asignacion: { contratistaId: ctx.userId } },
    include: { asignacion: { include: { contrato: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Detalle de una cuenta de cobro (propia). */
export async function obtenerCuentaCobro(id: string) {
  const { ctx, db } = await requireTenant("cuentaCobro:read");
  const cuenta = await db.cuentaCobro.findUnique({
    where: { id },
    include: {
      asignacion: { include: { contrato: { include: { obligaciones: true } } } },
      firma: true,
      documentosAnexos: true,
      informe: {
        include: {
          obligacionesEjecutadas: { include: { evidencias: true, obligacionContrato: true } },
          supervision: true,
        },
      },
      acta: true,
    },
  });
  // Defensa: solo el dueño (o la persona de contratación lo ve por otra vía).
  if (cuenta && cuenta.asignacion.contratistaId !== ctx.userId) {
    throw new Error("No autorizado para ver esta cuenta de cobro");
  }
  return cuenta;
}

/** Guarda la firma (subida o dibujada) de la cuenta de cobro. */
export async function guardarFirma(input: GuardarFirmaInput) {
  const { ctx, db } = await requireTenant("cuentaCobro:create");
  const data = guardarFirmaInput.parse(input);

  const cuenta = await db.cuentaCobro.findUnique({
    where: { id: data.cuentaCobroId },
    include: { asignacion: true },
  });
  if (!cuenta || cuenta.asignacion.contratistaId !== ctx.userId) {
    throw new Error("Cuenta de cobro no encontrada");
  }

  await db.cuentaCobro.update({
    where: { id: data.cuentaCobroId },
    data: { firma: { upsert: { create: { blobUrl: data.blobUrl, origen: data.origen }, update: { blobUrl: data.blobUrl, origen: data.origen } } } },
  });
  revalidatePath(`/cuentas-cobro/${data.cuentaCobroId}`);
  return { ok: true };
}

/** Envía la cuenta de cobro a revisión (BORRADOR -> EN_REVISION). */
export async function enviarARevision(cuentaCobroId: string) {
  const { ctx, db } = await requireTenant("cuentaCobro:create");
  const cuenta = await db.cuentaCobro.findUnique({
    where: { id: cuentaCobroId },
    include: { asignacion: true, documentosAnexos: true, informe: { include: { obligacionesEjecutadas: { include: { evidencias: true } } } } },
  });
  if (!cuenta || cuenta.asignacion.contratistaId !== ctx.userId) {
    throw new Error("Cuenta de cobro no encontrada");
  }

  // Validaciones de negocio antes de enviar:
  if (!cuenta.informe || cuenta.informe.obligacionesEjecutadas.length === 0) {
    throw new Error("Debe reportar al menos una obligación ejecutada");
  }
  // Evidencia obligatoria por cada obligación reportada.
  const sinEvidencia = cuenta.informe.obligacionesEjecutadas.some((o) => o.evidencias.length === 0);
  if (sinEvidencia) throw new Error("Cada obligación reportada requiere evidencia");
  // Planilla de seguridad social obligatoria.
  const tieneSeguridadSocial = cuenta.documentosAnexos.some((d) => d.tipo === "SEGURIDAD_SOCIAL");
  if (!tieneSeguridadSocial) throw new Error("Adjunte la planilla de seguridad social");

  await db.cuentaCobro.update({ where: { id: cuentaCobroId }, data: { estado: "EN_REVISION" } });
  await db.informeActividades.update({ where: { id: cuenta.informe.id }, data: { estado: "EN_REVISION" } });

  revalidatePath(`/cuentas-cobro/${cuentaCobroId}`);
  return { ok: true };
}
