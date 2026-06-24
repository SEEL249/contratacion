"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireTenant } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { crearUsuarioInput, type CrearUsuarioInput } from "./schema";

// Server Actions de gestión de usuarios de la entidad. Rol: ADMIN_TENANT
// (permiso "tenant:configure"). El cliente `db` es tenant-scoped: las consultas
// y escrituras sobre User ya quedan filtradas/inyectadas por tenantId.

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Lista los usuarios de la entidad. */
export async function listarUsuarios() {
  const { db } = await requireTenant("tenant:configure");
  return db.user.findMany({
    orderBy: [{ role: "asc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      email: true,
      role: true,
      cedula: true,
      activo: true,
      createdAt: true,
    },
  });
}

/** Crea un usuario dentro de la entidad. */
export async function crearUsuario(input: CrearUsuarioInput): Promise<ActionResult> {
  const { ctx, db } = await requireTenant("tenant:configure");

  const parsed = crearUsuarioInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  try {
    await db.user.create({
      data: {
        tenantId: ctx.tenantId!,
        nombre: data.nombre,
        email: data.email.toLowerCase(),
        role: data.role,
        cedula: data.cedula?.trim() ? data.cedula.trim() : null,
        passwordHash: hashPassword(data.password),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Ya existe un usuario con ese correo en la entidad." };
    }
    throw e;
  }

  revalidatePath("/usuarios");
  return { ok: true };
}

/** Activa o desactiva un usuario (bloquea/permite su acceso). */
export async function cambiarEstadoUsuario(id: string, activo: boolean): Promise<ActionResult> {
  const { db } = await requireTenant("tenant:configure");
  await db.user.update({ where: { id }, data: { activo } });
  revalidatePath("/usuarios");
  return { ok: true };
}
