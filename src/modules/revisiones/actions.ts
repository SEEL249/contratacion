"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth/session";
import { sendMail, mailAprobacion, mailRechazo } from "@/lib/mail/mail";
import { generarActaParcial } from "@/modules/actas/actions";
import { revisarInput, type RevisarInput } from "./schema";

// Flujo de revisión (Persona de Contratación): aprobar/rechazar cuentas de cobro
// EN_REVISION. Notifica al contratista por correo. Ver docs/00...§5.8 y §6 Fase 6.

/** Lista las cuentas de cobro pendientes de revisión en el tenant. */
export async function listarPendientesDeRevision() {
  const { db } = await requireTenant("informe:read");
  return db.cuentaCobro.findMany({
    where: { estado: "EN_REVISION" },
    include: { asignacion: { include: { contrato: true, contratista: true } } },
    orderBy: { updatedAt: "asc" },
  });
}

/**
 * Aprueba o rechaza una cuenta de cobro. Al rechazar exige observaciones.
 * Notifica por correo y, al aprobar, genera el acta parcial del período.
 */
export async function revisar(input: RevisarInput) {
  const data = revisarInput.parse(input);
  const permiso = data.accion === "APROBAR" ? "revision:approve" : "revision:reject";
  const { ctx, db } = await requireTenant(permiso);

  const cuenta = await db.cuentaCobro.findUnique({
    where: { id: data.cuentaCobroId },
    include: { asignacion: { include: { contratista: true } }, informe: true },
  });
  if (!cuenta) throw new Error("Cuenta de cobro no encontrada");
  if (cuenta.estado !== "EN_REVISION") throw new Error("La cuenta no está en revisión");

  const nuevoEstado = data.accion === "APROBAR" ? "APROBADO" : "RECHAZADO";

  // Registrar la revisión + actualizar estados.
  await db.revision.create({
    data: {
      tenantId: ctx.tenantId!,
      cuentaCobroId: cuenta.id,
      revisorId: ctx.userId,
      accion: data.accion,
      observaciones: data.observaciones,
      notificado: false,
    },
  });
  await db.cuentaCobro.update({ where: { id: cuenta.id }, data: { estado: nuevoEstado } });
  if (cuenta.informe) {
    await db.informeActividades.update({ where: { id: cuenta.informe.id }, data: { estado: nuevoEstado } });
  }

  // Acta parcial al aprobar.
  if (data.accion === "APROBAR") {
    await generarActaParcial(cuenta.id);
  }

  // Notificación por correo al contratista.
  const correo = cuenta.asignacion.contratista.email;
  const args = {
    contratista: cuenta.nombreContratista,
    numeroContrato: cuenta.asignacion.numeroContrato,
    cuota: cuenta.numeroCuota,
  };
  const msg =
    data.accion === "APROBAR"
      ? mailAprobacion(args)
      : mailRechazo({ ...args, observaciones: data.observaciones! });
  await sendMail({ to: correo, subject: msg.subject, html: msg.html });
  await db.revision.updateMany({
    where: { cuentaCobroId: cuenta.id, notificado: false },
    data: { notificado: true },
  });

  revalidatePath("/revisiones");
  return { ok: true, estado: nuevoEstado };
}
