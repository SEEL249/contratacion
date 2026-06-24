import { prisma } from "@/lib/db/prisma";
import { calcularVencimiento, type Plan } from "./plan";

// Lógica de facturación reutilizable (sin auth): la usan tanto la Server Action
// del superadmin (registrarPago) como el webhook de pagos. Renovar = avanzar el
// vencimiento un periodo del plan y reactivar la entidad.

export type RenovacionResult =
  | { ok: true; tenantId: string; fechaVencimiento: Date }
  | { ok: false; error: string };

export async function renovarSuscripcion(tenantId: string): Promise<RenovacionResult> {
  const t = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true, fechaVencimiento: true },
  });
  if (!t) return { ok: false, error: "Entidad no encontrada." };

  const ahora = new Date();
  // Si aún no ha vencido, se acumula sobre el vencimiento vigente; si ya venció
  // (o no tenía), se cuenta desde hoy.
  const base = t.fechaVencimiento && t.fechaVencimiento > ahora ? t.fechaVencimiento : ahora;
  const fechaVencimiento = calcularVencimiento(base, t.plan as Plan);

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { activo: true, fechaVencimiento },
  });
  return { ok: true, tenantId, fechaVencimiento };
}
