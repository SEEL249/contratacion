"use server";

import { requireTenant } from "@/lib/auth/session";

// El supervisor SOLO ve el informe de supervisión del MES ACTUAL del contrato
// bajo su supervisión. Ver docs/00...§8 y §5.5.

export async function listarSupervisionMesActual() {
  const { ctx, db } = await requireTenant("supervision:read");

  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  const cuentas = await db.cuentaCobro.findMany({
    where: {
      asignacion: { supervisorId: ctx.userId },
      createdAt: { gte: inicioMes },
      informe: { supervision: { isNot: null } },
    },
    include: {
      asignacion: { include: { contrato: true, contratista: true } },
      informe: { include: { supervision: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return cuentas.map((c) => ({
    numeroContrato: c.asignacion.numeroContrato,
    contratista: c.asignacion.contratista.nombre,
    objeto: c.asignacion.contrato.objeto,
    cuota: c.numeroCuota,
    contenido: c.informe!.supervision!.contenido,
  }));
}
