"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireTenant } from "@/lib/auth/session";
import { PLANTILLAS_DEFAULT } from "@/lib/plantillas/defaults";

// Server Actions de gestión de plantillas de la entidad. Rol: ADMIN_TENANT.
// Las plantillas son los formatos de documentos (contrato, actas, cuenta de
// cobro, parafiscales) con marcadores {{campo}} que se rellenan al generar.

export type ActionResult = { ok: true; mensaje?: string } | { ok: false; error: string };

/** Lista las plantillas de la entidad. */
export async function listarPlantillas() {
  const { db } = await requireTenant("tenant:configure");
  return db.plantilla.findMany({
    orderBy: [{ tipo: "asc" }, { version: "desc" }],
    select: {
      id: true,
      tipo: true,
      nombre: true,
      version: true,
      activa: true,
      updatedAt: true,
    },
  });
}

/** Carga el juego de plantillas por defecto (solo si la entidad no tiene ninguna). */
export async function cargarPlantillasPorDefecto(): Promise<ActionResult> {
  const { ctx, db } = await requireTenant("tenant:configure");

  const existentes = await db.plantilla.count();
  if (existentes > 0) {
    return { ok: false, error: "La entidad ya tiene plantillas; no se cargaron las de defecto." };
  }

  await db.plantilla.createMany({
    data: PLANTILLAS_DEFAULT.map((p) => ({
      tenantId: ctx.tenantId!,
      tipo: p.tipo,
      nombre: p.nombre,
      contenido: p.contenido as unknown as Prisma.InputJsonValue,
    })),
  });

  revalidatePath("/plantillas");
  return { ok: true, mensaje: `Se cargaron ${PLANTILLAS_DEFAULT.length} plantillas por defecto.` };
}

/** Activa o desactiva una plantilla. */
export async function cambiarEstadoPlantilla(id: string, activa: boolean): Promise<ActionResult> {
  const { db } = await requireTenant("tenant:configure");
  await db.plantilla.update({ where: { id }, data: { activa } });
  revalidatePath("/plantillas");
  return { ok: true };
}
