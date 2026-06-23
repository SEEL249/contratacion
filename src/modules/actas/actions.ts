"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth/session";
import type { TenantClient } from "@/lib/db/tenant-scope";
import { renderPlantilla, type PlantillaContenido } from "@/lib/documentos/render";
import type { TipoPlantilla } from "@prisma/client";

// Generación de actas (INICIAL / PARCIAL / FINAL). Todas se producen desde
// plantillas del tenant; solo varían los campos del período. Ver docs/00...§5.6.

async function plantillaTenant(db: TenantClient, tipo: TipoPlantilla): Promise<PlantillaContenido | null> {
  const p = await db.plantilla.findFirst({ where: { tipo, activa: true }, orderBy: { version: "desc" } });
  return (p?.contenido as unknown as PlantillaContenido | undefined) ?? null;
}

function aNumero(v: unknown): number {
  return typeof v === "object" && v !== null ? Number(v.toString()) : Number(v);
}

/** Acta inicial: primer pago + valor pendiente de las cuotas siguientes. */
export async function generarActaInicial(asignacionId: string) {
  const { ctx, db } = await requireTenant("contrato:read");
  // ContratoContratista no es tenant-scoped: filtramos por la relación al contrato.
  const asignacion = await db.contratoContratista.findFirst({
    where: { id: asignacionId, contrato: { tenantId: ctx.tenantId! } },
    include: { contrato: true, contratista: true },
  });
  if (!asignacion) throw new Error("Asignación no encontrada");

  const valorCuota = aNumero(asignacion.contrato.valorCuota);
  const valorTotal = aNumero(asignacion.contrato.valorTotal);
  const datos = {
    numeroContrato: asignacion.numeroContrato,
    fecha: new Date().toISOString().slice(0, 10),
    nombreContratista: asignacion.contratista.nombre,
    objeto: asignacion.contrato.objeto,
    valorPrimerPago: valorCuota,
    valorPendiente: valorTotal - valorCuota,
  };

  const plantilla = await plantillaTenant(db, "ACTA_INICIAL");
  const render = plantilla ? renderPlantilla(plantilla, datos) : null;

  const acta = await db.acta.create({
    data: { tenantId: ctx.tenantId!, asignacionId, tipo: "INICIAL", datos: { ...datos, render } },
  });
  revalidatePath(`/contratos/${asignacion.contratoId}`);
  return acta;
}

/** Acta parcial: pago del mes + saldo pendiente. Vinculada a la cuenta de cobro. */
export async function generarActaParcial(cuentaCobroId: string) {
  const { ctx, db } = await requireTenant("cuentaCobro:read");
  const cuenta = await db.cuentaCobro.findUnique({
    where: { id: cuentaCobroId },
    include: { asignacion: { include: { contrato: true } } },
  });
  if (!cuenta) throw new Error("Cuenta de cobro no encontrada");

  const valorCuota = aNumero(cuenta.valorCuota);
  const valorTotal = aNumero(cuenta.valorTotalContrato);
  const saldoPendiente = valorTotal - valorCuota * cuenta.numeroCuota;
  const datos = {
    numeroContrato: cuenta.asignacion.numeroContrato,
    numeroCuota: cuenta.numeroCuota,
    periodo: new Date().toISOString().slice(0, 7),
    nombreContratista: cuenta.nombreContratista,
    valorPago: valorCuota,
    saldoPendiente: Math.max(saldoPendiente, 0),
  };

  const plantilla = await plantillaTenant(db, "ACTA_PARCIAL");
  const render = plantilla ? renderPlantilla(plantilla, datos) : null;

  const acta = await db.acta.create({
    data: {
      tenantId: ctx.tenantId!,
      asignacionId: cuenta.asignacionId,
      tipo: "PARCIAL",
      cuentaCobroId,
      datos: { ...datos, render },
    },
  });
  revalidatePath(`/cuentas-cobro/${cuentaCobroId}`);
  return acta;
}

/** Acta final: relaciona todos los pagos generados durante la ejecución. */
export async function generarActaFinal(asignacionId: string) {
  const { ctx, db } = await requireTenant("contrato:read");
  const asignacion = await db.contratoContratista.findFirst({
    where: { id: asignacionId, contrato: { tenantId: ctx.tenantId! } },
    include: {
      contrato: true,
      contratista: true,
      cuentasCobro: { where: { estado: "APROBADO" }, orderBy: { numeroCuota: "asc" } },
    },
  });
  if (!asignacion) throw new Error("Asignación no encontrada");

  const relacionPagos = asignacion.cuentasCobro
    .map((c) => `Cuota ${c.numeroCuota}: ${c.valorCuota}`)
    .join("; ");
  const totalPagado = asignacion.cuentasCobro.reduce((acc, c) => acc + aNumero(c.valorCuota), 0);

  const datos = {
    numeroContrato: asignacion.numeroContrato,
    nombreContratista: asignacion.contratista.nombre,
    objeto: asignacion.contrato.objeto,
    relacionPagos,
    totalPagado,
  };

  const plantilla = await plantillaTenant(db, "ACTA_FINAL");
  const render = plantilla ? renderPlantilla(plantilla, datos) : null;

  const acta = await db.acta.create({
    data: { tenantId: ctx.tenantId!, asignacionId, tipo: "FINAL", datos: { ...datos, render } },
  });
  revalidatePath(`/contratos/${asignacion.contratoId}`);
  return acta;
}
