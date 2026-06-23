"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth/session";
import { registrarAnexoInput, type RegistrarAnexoInput } from "./schema";

// Documentos anexos de la cuenta de cobro (subidos previamente vía /api/upload):
// planilla de seguridad social (obligatoria), parafiscales (config. por tenant)
// y otros soportes. Ver docs/00...§5.7 y docs/01-reglas-negocio-co.md §4.

/** Registra un documento anexo en la cuenta de cobro del contratista autenticado. */
export async function registrarAnexo(input: RegistrarAnexoInput) {
  const { ctx, db } = await requireTenant("cuentaCobro:create");
  const data = registrarAnexoInput.parse(input);

  const cuenta = await db.cuentaCobro.findUnique({
    where: { id: data.cuentaCobroId },
    include: { asignacion: true },
  });
  if (!cuenta || cuenta.asignacion.contratistaId !== ctx.userId) {
    throw new Error("Cuenta de cobro no encontrada");
  }
  if (cuenta.estado !== "BORRADOR") throw new Error("La cuenta ya fue enviada a revisión");

  const anexo = await db.documentoAnexo.create({
    data: {
      cuentaCobroId: data.cuentaCobroId,
      tipo: data.tipo,
      blobUrl: data.blobUrl,
      nombre: data.nombre,
      mimeType: data.mimeType,
      tamanoBytes: data.tamanoBytes,
    },
  });
  revalidatePath(`/cuentas-cobro/${data.cuentaCobroId}`);
  return anexo;
}

/** Elimina un anexo (solo en BORRADOR y de cuenta propia). */
export async function eliminarAnexo(anexoId: string) {
  const { ctx, db } = await requireTenant("cuentaCobro:create");
  const anexo = await db.documentoAnexo.findUnique({
    where: { id: anexoId },
    include: { cuentaCobro: { include: { asignacion: true } } },
  });
  if (!anexo || anexo.cuentaCobro.asignacion.contratistaId !== ctx.userId) {
    throw new Error("Anexo no encontrado");
  }
  if (anexo.cuentaCobro.estado !== "BORRADOR") throw new Error("La cuenta ya fue enviada");

  await db.documentoAnexo.delete({ where: { id: anexoId } });
  revalidatePath(`/cuentas-cobro/${anexo.cuentaCobroId}`);
  return { ok: true };
}
