"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth/session";
import type { TenantClient } from "@/lib/db/tenant-scope";
import { ampliar, generarInformeSupervision } from "@/lib/ai/grok";
import type { EstandarRedaccion } from "@/lib/ai/prompts";
import { registrarObligacionInput, type RegistrarObligacionInput } from "./schema";

// Server Actions del informe de actividades. La IA (Grok) amplía la descripción
// del contratista al estándar institucional, y genera el informe de supervisión
// en 3ª persona. Ver docs/02-prompts-grok.md.

/** Carga la cuenta + informe del contratista autenticado, validando propiedad. */
async function cuentaPropia(db: TenantClient, userId: string, cuentaCobroId: string) {
  const cuenta = await db.cuentaCobro.findUnique({
    where: { id: cuentaCobroId },
    include: { asignacion: { include: { contrato: true } }, informe: true },
  });
  if (!cuenta || cuenta.asignacion.contratistaId !== userId) {
    throw new Error("Cuenta de cobro no encontrada");
  }
  if (cuenta.estado !== "BORRADOR") throw new Error("La cuenta ya fue enviada a revisión");
  return cuenta;
}

/**
 * Registra una obligación ejecutada con su evidencia (obligatoria) y, si se pide,
 * amplía la descripción con IA. Guarda texto original y ampliado (trazabilidad).
 */
export async function registrarObligacionEjecutada(input: RegistrarObligacionInput) {
  const { ctx, db } = await requireTenant("informe:create");
  const data = registrarObligacionInput.parse(input);

  const cuenta = await cuentaPropia(db, ctx.userId, data.cuentaCobroId);
  if (!cuenta.informe) throw new Error("La cuenta no tiene informe asociado");

  // La obligación debe pertenecer al contrato de la asignación.
  const obligacion = await db.obligacionContrato.findFirst({
    where: { id: data.obligacionContratoId, contratoId: cuenta.asignacion.contratoId },
  });
  if (!obligacion) throw new Error("La obligación no pertenece a este contrato");

  // Ampliación IA (opcional). Estándar configurable por tenant.
  let descripcionAmpliada: string | undefined;
  let promptVersion: string | undefined;
  let modeloIa: string | undefined;
  if (data.ampliarConIa) {
    const tenant = await db.tenant.findUnique({ where: { id: ctx.tenantId! } });
    const estandar = (tenant?.config as { estandarRedaccion?: Partial<EstandarRedaccion> } | null)
      ?.estandarRedaccion;
    const res = await ampliar({
      textoObligacionContrato: obligacion.texto,
      descripcionContratista: data.descripcionContratista,
      estandar: estandar
        ? {
            numeroParrafos: estandar.numeroParrafos ?? 5,
            lineasPorParrafo: estandar.lineasPorParrafo ?? 8,
            tono: estandar.tono ?? "formal institucional, sector público colombiano",
            personaInforme: "primera",
          }
        : undefined,
    });
    descripcionAmpliada = res.texto;
    promptVersion = res.promptVersion;
    modeloIa = res.modelo;
  }

  const creada = await db.obligacionEjecutada.create({
    data: {
      informeId: cuenta.informe.id,
      obligacionContratoId: obligacion.id,
      descripcionContratista: data.descripcionContratista,
      descripcionAmpliada,
      promptVersion,
      modeloIa,
      evidencias: { create: data.evidencias },
    },
    include: { evidencias: true },
  });

  revalidatePath(`/cuentas-cobro/${data.cuentaCobroId}`);
  return creada;
}

/** Permite editar manualmente la descripción ampliada (override del texto IA). */
export async function editarDescripcionAmpliada(obligacionEjecutadaId: string, texto: string) {
  const { ctx, db } = await requireTenant("informe:create");
  // ObligacionEjecutada no es tenant-scoped: verificamos propiedad vía la cadena
  // informe → cuenta → asignación → contratista.
  const oe = await db.obligacionEjecutada.findUnique({
    where: { id: obligacionEjecutadaId },
    include: { informe: { include: { cuentaCobro: { include: { asignacion: true } } } } },
  });
  if (!oe || oe.informe.cuentaCobro?.asignacion.contratistaId !== ctx.userId) {
    throw new Error("Registro no encontrado");
  }
  await db.obligacionEjecutada.update({
    where: { id: obligacionEjecutadaId },
    data: { descripcionAmpliada: texto },
  });
  return { ok: true };
}

/**
 * Genera (o regenera) el informe de supervisión en 3ª persona a partir del
 * informe de actividades. Se dispara tras completar el informe del contratista.
 */
export async function generarSupervision(cuentaCobroId: string) {
  const { ctx, db } = await requireTenant("informe:create");
  const cuenta = await db.cuentaCobro.findUnique({
    where: { id: cuentaCobroId },
    include: {
      asignacion: { include: { contrato: true } },
      informe: {
        include: { obligacionesEjecutadas: { include: { obligacionContrato: true } } },
      },
    },
  });
  if (!cuenta || cuenta.asignacion.contratistaId !== ctx.userId) {
    throw new Error("Cuenta de cobro no encontrada");
  }
  if (!cuenta.informe || cuenta.informe.obligacionesEjecutadas.length === 0) {
    throw new Error("No hay obligaciones ejecutadas para generar la supervisión");
  }

  // Texto del informe de actividades consolidado (usa el ampliado si existe).
  const informeTexto = cuenta.informe.obligacionesEjecutadas
    .map(
      (o, i) =>
        `OBLIGACIÓN ${i + 1}: ${o.obligacionContrato.texto}\n` +
        `EJECUCIÓN: ${o.descripcionAmpliada ?? o.descripcionContratista}`,
    )
    .join("\n\n");

  const res = await generarInformeSupervision({
    nombreContratista: cuenta.nombreContratista,
    numeroContrato: cuenta.asignacion.numeroContrato,
    objetoContrato: cuenta.asignacion.contrato.objeto,
    numeroCuota: cuenta.numeroCuota,
    informeActividadesCompleto: informeTexto,
  });

  await db.informeActividades.update({
    where: { id: cuenta.informe.id },
    data: {
      supervision: {
        upsert: {
          create: { contenido: res.texto, promptVersion: res.promptVersion, modeloIa: res.modelo },
          update: { contenido: res.texto, promptVersion: res.promptVersion, modeloIa: res.modelo },
        },
      },
    },
  });

  revalidatePath(`/cuentas-cobro/${cuentaCobroId}`);
  return { ok: true };
}
