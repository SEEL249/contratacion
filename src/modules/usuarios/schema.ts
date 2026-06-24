import { z } from "zod";

// Roles que un ADMIN_TENANT puede asignar dentro de su entidad
// (no incluye SUPERADMIN, que vive fuera de cualquier tenant).
export const ROLES_ASIGNABLES = [
  "ADMIN_TENANT",
  "PERSONA_CONTRATACION",
  "SUPERVISOR",
  "CONTRATISTA",
] as const;

export const crearUsuarioInput = z.object({
  nombre: z.string().min(3, "El nombre es muy corto").max(120),
  email: z.string().email("Correo inválido"),
  role: z.enum(ROLES_ASIGNABLES),
  cedula: z.string().max(20).optional(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioInput>;
